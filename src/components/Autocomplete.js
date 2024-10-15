import React, { useState } from "react";
import * as SmartySDK from "smartystreets-javascript-sdk";
import * as sdkUtils from "smartystreets-javascript-sdk-utils";
import InputForm from "./InputForm";
import Suggestions from "./Suggestions";

const Autocomplete = () => {
	const [formValues, setFormValues] = useState({
		address1: "",
		address2: "",
		city: "",
		state: "",
		zipCode: "",
		country: "US",
	});
	const [suggestions, setSuggestions] = useState({result: []});
	const [shouldValidate, setShouldValidate] = useState(true);
	const [error, setError] = useState("");

	const SmartyCore = SmartySDK.core;
	const websiteKey = ""; // Your website key here
	const smartySharedCredentials = new SmartyCore.SharedCredentials(websiteKey);

	const autoCompleteClient = new SmartyCore.ClientBuilder(smartySharedCredentials).withLicenses(["us-autocomplete-pro-cloud"]).buildUsAutocompleteProClient();
	const internationalautocompleteClient = new SmartyCore.ClientBuilder(smartySharedCredentials).withLicenses(["international-autocomplete-v2-cloud"]).buildInternationalAddressAutocompleteClient();
	const usStreetClient = new SmartyCore.ClientBuilder(smartySharedCredentials).buildUsStreetApiClient();
	const internationalStreetClient = new SmartyCore.ClientBuilder(smartySharedCredentials).buildInternationalStreetClient();
	
	const formatAutocompleteSuggestion = (suggestion) => {
		const addressText = suggestion.addressText ? `${suggestion.addressText} ` : "";
		const street = suggestion.streetLine ? `${suggestion.streetLine} ` : "";
		const secondary = suggestion?.secondary ? `${suggestion.secondary} ` : "";
		const entries = suggestion?.entries !== 0 ? `(${suggestion.entries}) ` : "";
		const city = suggestion?.city ? `${suggestion.city} ` : "";
		const state = suggestion?.state ? `${suggestion.state}, ` : "";
		const zip = suggestion?.zipcode ? `${suggestion.zipcode}` : "";

		return addressText + street + secondary + entries + city + state + zip;
	};

	const createUSLookup = (query, hasSecondaries) => {
		const lookup = new SmartySDK.usAutocompletePro.Lookup(query);
		if (hasSecondaries) {
			lookup.selected = query;
		}
		return lookup;
	};
	
	const createInternationalLookup = (query, addressId, hasSecondaries) => {
		const lookup = new SmartySDK.internationalAddressAutocomplete.Lookup(hasSecondaries ? { addressId } : query);
		if (!hasSecondaries) {
			lookup.search = query;
		}
		return lookup;
	};
	
	const queryAutocompleteForSuggestions = async (query, addressId, hasSecondaries = false) => {
		const isUS = formValues.country === "US";
		
		const client = isUS ? autoCompleteClient : internationalautocompleteClient;
		const lookup = isUS
			? createUSLookup(query, hasSecondaries)
			: createInternationalLookup(query, addressId, hasSecondaries);
	
		lookup.country = formValues.country;
	
		try {
			const results = await client.send(lookup);
			setSuggestions(results);
		} catch (error) {
			console.warn(error);
		}
	};

	const getFormValues = async (address) => {
		if (address.addressText) {
			const lookup = createInternationalLookup(address.addressText, address.addressId, true);
			lookup.country = formValues.country;
			try {
				const results = await internationalautocompleteClient.send(lookup);
				const result = results.result[0];
				return {
					...formValues,
					address1: result.street || "",
					address2: result.secondary || "",
					city: result.locality || "",
					state: result.administrativeArea || "",
					zipCode: result.postalCode || "",
				};
			} catch (error) {
				console.warn(error);
				return formValues; // Return current formValues in case of error
			}
		} else {
			return {
				...formValues,
				address1: address.streetLine || "",
				address2: address.secondary || "",
				city: address.city || "",
				state: address.state || "",
				zipCode: address.zipcode || "",
			};
		}
	};
	  
	const selectSuggestion = async (suggestion) => {
		if (suggestion.entries > 1) {
			await queryAutocompleteForSuggestions(formatAutocompleteSuggestion(suggestion), suggestion.addressId, true);
		} else {
			const newFormValues = await getFormValues(suggestion);
			setFormValues(newFormValues);
			
			if (shouldValidate) {
				await validateAddress(newFormValues);
			}
		}
	};

	const validateAddress = async (addressToValidate) => {
		setError("");
		if (addressToValidate.country === "US") {
			const lookup = new SmartySDK.usStreet.Lookup();
			lookup.street = addressToValidate.address1;
			lookup.street2 = addressToValidate.address2;
			lookup.city = addressToValidate.city;
			lookup.state = addressToValidate.state;
			lookup.zipCode = addressToValidate.zipCode;

			if (!!lookup.street) {
				try {
					const response = await usStreetClient.send(lookup);
					updateStateFromValidatedUsAddress(response, true);
				} catch (e) {
					setError(e.error);
				}
			} else {
				setError("A street address is required.");
			}
		} else {
			const lookup = new SmartySDK.internationalStreet.Lookup();
			lookup.freeform = addressToValidate.freeform || formatAutocompleteSuggestion(addressToValidate);
			lookup.country = addressToValidate.country;

			try {
				const response = await internationalStreetClient.send(lookup);
				updateStateFromValidatedInternationalAddress(response, true);
			} catch (e) {
				setError(e.error);
			}
		}
	};

	const updateStateFromValidatedUsAddress = (response, isAutocomplete = false) => {
		const lookup = response.lookups[0];
		const isValid = sdkUtils.isValid(lookup);
		const isAmbiguous = sdkUtils.isAmbiguous(lookup);
		const isMissingSecondary = sdkUtils.isMissingSecondary(lookup);

		const newFormValues = {};

		if (!isValid) {
			setError("The address is invalid.");
		} else if (isAmbiguous) {
			setError("The address is ambiguous.");
		} else if (isMissingSecondary && !isAutocomplete) {
			setError("The address is missing a secondary number.");
		} else if (isValid) {
			const candidate = lookup.result[0];

			newFormValues.address1 = candidate.deliveryLine1;
			newFormValues.address2 = candidate.deliveryLine2 || "";
			newFormValues.city = candidate.components.cityName;
			newFormValues.state = candidate.components.state;
			newFormValues.zipCode = `${candidate.components.zipCode}-${candidate.components.plus4Code}`;
			setFormValues(prevState => ({...prevState, ...newFormValues}));
		}
	};

	const updateStateFromValidatedInternationalAddress = (response) => {
		const result = response.result[0].components;
		const newFormValues = {
			address1: result.address1 || formValues.address1,
			address2: result.address2 || formValues.address2,
			city: result.locality || formValues.city,
			state: result.administrativeArea || formValues.state,
			zipCode: result.postalCode || formValues.zipCode,
		};

		setFormValues(prevState => ({...prevState, ...newFormValues}));
	};

	return (
		<div>
			<div>
				<InputForm
					queryAutocompleteForSuggestions={queryAutocompleteForSuggestions}
					formValues={formValues}
					setFormValues={setFormValues}
					shouldValidate={shouldValidate}
					setShouldValidate={setShouldValidate}
					validateCallback={validateAddress}
				/>
				<Suggestions
					suggestions={suggestions}
					selectSuggestion={selectSuggestion}
				/>
			</div>
			{error &&
				<div>
					<h3>Validation Error:</h3>
					{error}
				</div>
			}
		</div>
	);
};

export default Autocomplete;