import React, { useState, useEffect } from "react";
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
	const [freeform, setFreeform] = useState("");
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

	// Helper
	const createUSLookup = (query, hasSecondaries) => {
		const lookup = new SmartySDK.usAutocompletePro.Lookup(query);
		if (hasSecondaries) {
			lookup.selected = query;
		}
		return lookup;
	};
	
	// Helper
	const createInternationalLookup = (query, addressId, hasSecondaries) => {
		const lookup = new SmartySDK.internationalAddressAutocomplete.Lookup(hasSecondaries ? { addressId } : query);
		if (!hasSecondaries) {
			lookup.search = query;
		}
		return lookup;
	};
	
	const queryAutocompleteForSuggestions = (query, addressId, hasSecondaries = false) => {
		const isUS = formValues.country === "US";
		
		const client = isUS ? autoCompleteClient : internationalautocompleteClient;
		const lookup = isUS
			? createUSLookup(query, hasSecondaries)
			: createInternationalLookup(query, addressId, hasSecondaries);
	
		lookup.country = formValues.country;
	
		client.send(lookup)
			.then(results => {
				setSuggestions(results);
			})
			.catch(console.warn);
	};

	const useAutoCompleteSuggestion = (suggestion) => {
		if (formValues.country === "US") {
			setFormValues(prevState => ({
				...prevState,
				address1: suggestion.streetLine,
				address2: suggestion.secondary,
				city: suggestion.city,
				state: suggestion.state,
				zipCode: suggestion.zipcode,
			}))
		} else {
			console.log("freeform intl", suggestion);
			setFreeform(suggestion.addressText);
		}
	};

	const selectSuggestion = (suggestion) => {
		if (suggestion.entries > 1) {
			// Get secondaries
			queryAutocompleteForSuggestions(formatAutocompleteSuggestion(suggestion), suggestion.addressId, true);
		} else {
			useAutoCompleteSuggestion(suggestion)
			
			if (shouldValidate) validateAddress();
		}
	};

	const validateAddress = () => {
		if (formValues.country === "US") {
			const lookup = new SmartySDK.usStreet.Lookup();
			lookup.street = formValues.address1;
			lookup.street2 = formValues.address2;
			lookup.city = formValues.city;
			lookup.state = formValues.state;
			lookup.zipCode = formValues.zipCode;

			if (!!lookup.street) {
				console.log("lookup", lookup);
				usStreetClient.send(lookup)
					.then((response) => {
						console.log("response!!", response);
						updateStateFromValidatedUsAddress(response, true)
					})
					.catch(e => setError(e.error));
			} else {
				setError("A street address is required.");
			}
		} else {
			const lookup = new SmartySDK.internationalStreet.Lookup();
			lookup.freeform = freeform;
			lookup.country = formValues.country;

			internationalStreetClient.send(lookup)
				.then((response) => updateStateFromValidatedInternationalAddress(response, true))
				.catch(e => setError(e.error));
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

	const updateStateFromValidatedInternationalAddress = (response, isAutocomplete = false) => {
		const result = response.result[0];
		const newFormValues = {
			address1: result.address1,
			address2: result.address2,
			city: result.components.locality,
			state: result.components.administrativeArea,
			zipCode: result.components.postalCode,
		};

		setFormValues(prevState => ({...prevState, ...newFormValues}));
		setError("");
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