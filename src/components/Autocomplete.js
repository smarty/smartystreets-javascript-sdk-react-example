import React, { useState, useEffect, useCallback } from "react";
import * as SmartySDK from "smartystreets-javascript-sdk";
import * as sdkUtils from "smartystreets-javascript-sdk-utils";
import InputForm from "./InputForm";
import Suggestions from "./Suggestions";

const Autocomplete = () => {
	const [state, setState] = useState({
		lookup: new SmartySDK.usAutocompletePro.Lookup(),
		client: null,
		shouldValidate: true,
		freeform: "",
		address1: "",
		address2: "",
		city: "",
		state: "",
		zipCode: "",
		country: "US",
		suggestions: {result: []},
		error: "",
	});

	const SmartyCore = SmartySDK.core;
	const websiteKey = "173801724660243622"; // Your website key here
	const smartySharedCredentials = new SmartyCore.SharedCredentials(websiteKey);

	const autoCompleteClient = new SmartyCore.ClientBuilder(smartySharedCredentials).withLicenses(["us-autocomplete-pro-cloud"]).buildUsAutocompleteProClient();
	const internationalautocompleteClient = new SmartyCore.ClientBuilder(smartySharedCredentials).withLicenses(["international-autocomplete-v2-cloud"]).buildInternationalAddressAutocompleteClient();
	const usStreetClient = new SmartyCore.ClientBuilder(smartySharedCredentials).buildUsStreetApiClient();
	const internationalStreetClient = new SmartyCore.ClientBuilder(smartySharedCredentials).buildInternationalStreetClient();

	useEffect(() => {
		setState(prevState => ({...prevState, client: autoCompleteClient}));
	}, []);

	const updateStateFromForm = useCallback((key, value) => {
		setState(prevState => ({...prevState, [key]: value}));
	}, []);

	const updateField = useCallback((e) => {
		updateStateFromForm(e.target.id, e.target.value);
	}, [updateStateFromForm]);

	const updateCheckbox = useCallback((e) => {
		updateStateFromForm(e.target.id, e.target.checked);
	}, [updateStateFromForm]);

	const formatAutocompleteSuggestion = useCallback((suggestion) => {
		const addressText = suggestion.addressText ? `${suggestion.addressText} ` : "";
		const street = suggestion.streetLine ? `${suggestion.streetLine} ` : "";
		const secondary = suggestion?.secondary ? `${suggestion.secondary} ` : "";
		const entries = suggestion?.entries !== 0 ? `(${suggestion.entries}) ` : "";
		const city = suggestion?.city ? `${suggestion.city} ` : "";
		const state = suggestion?.state ? `${suggestion.state}, ` : "";
		const zip = suggestion?.zipcode ? `${suggestion.zipcode}` : "";

		return addressText + street + secondary + entries + city + state + zip;
	}, []);

	const queryAutocompleteForSuggestions = useCallback((query, addressId, hasSecondaries=false) => {
		let lookup;
		let client;

		if (state.country === "US") {
			lookup = new SmartySDK.usAutocompletePro.Lookup(query);
			client = autoCompleteClient;
			if (hasSecondaries) {
				lookup.selected = query;
			}
		} else {
			client = internationalautocompleteClient;
			if (hasSecondaries) {
				lookup = new SmartySDK.internationalAddressAutocomplete.Lookup({addressId: addressId});
			} else {
				lookup = new SmartySDK.internationalAddressAutocomplete.Lookup(query);
				lookup.search = query;
			}
		}
		lookup.country = state.country;

		client.send(lookup)
			.then(results => {
				setState(prevState => ({...prevState, suggestions: results}));
			})
			.catch(console.warn);
	}, [state.country]);

	const useAutoCompleteSuggestion = useCallback((suggestion) => {
		if (state.country === "US") {
			return new Promise(resolve => {
				setState(prevState => ({
					...prevState,
					address1: suggestion.streetLine,
					address2: suggestion.secondary,
					city: suggestion.city,
					state: suggestion.state,
					zipCode: suggestion.zipcode,
					suggestions: {result: []},
				}), resolve);
			});
		} else {
			return new Promise(resolve => {
				setState(prevState => ({
					...prevState,
					freeform: suggestion.addressText,
				}), resolve);
			})
		}
	}, [state.country]);

	const selectSuggestion = useCallback((suggestion) => {
		if (suggestion.entries > 1) {
			queryAutocompleteForSuggestions(formatAutocompleteSuggestion(suggestion), suggestion.addressId, true);
		} else {
			useAutoCompleteSuggestion(suggestion)
				.then(() => {
					if (state.shouldValidate) validateAddress();
				});
		}
	}, [state.shouldValidate, formatAutocompleteSuggestion, queryAutocompleteForSuggestions, useAutoCompleteSuggestion]);

	const validateAddress = useCallback(() => {
		if (state.country === "US") {
			let lookup = new SmartySDK.usStreet.Lookup();
			lookup.street = state.address1;
			lookup.street2 = state.address2;
			lookup.city = state.city;
			lookup.state = state.state;
			lookup.zipCode = state.zipCode;

			if (!!lookup.street) {
				usStreetClient.send(lookup)
					.then((response) => updateStateFromValidatedUsAddress(response, true))
					.catch(e => setState(prevState => ({...prevState, error: e.error})));
			} else {
				setState(prevState => ({...prevState, error: "A street address is required."}));
			}
		} else {
			let lookup = new SmartySDK.internationalStreet.Lookup();
			lookup.freeform = state.freeform;
			lookup.country = state.country;

			internationalStreetClient.send(lookup)
				.then((response) => updateStateFromValidatedInternationalAddress(response, true))
				.catch(e => setState(prevState => ({...prevState, error: e.error})));
		}
	}, [state]);

	const updateStateFromValidatedUsAddress = useCallback((response, isAutocomplete = false) => {
		const lookup = response.lookups[0];
		const isValid = sdkUtils.isValid(lookup);
		const isAmbiguous = sdkUtils.isAmbiguous(lookup);
		const isMissingSecondary = sdkUtils.isMissingSecondary(lookup);
		const newState = {
			error: "",
		};

		if (!isValid) {
			newState.error = "The address is invalid.";
		} else if (isAmbiguous) {
			newState.error = "The address is ambiguous.";
		} else if (isMissingSecondary && !isAutocomplete) {
			newState.error = "The address is missing a secondary number.";
		} else if (isValid) {
			const candidate = lookup.result[0];

			newState.address1 = candidate.deliveryLine1;
			newState.address2 = candidate.deliveryLine2 || "";
			newState.city = candidate.components.cityName;
			newState.state = candidate.components.state;
			newState.zipCode = `${candidate.components.zipCode}-${candidate.components.plus4Code}`;
			newState.error = "";
		}

		setState(prevState => ({...prevState, ...newState}));
	}, []);

	const updateStateFromValidatedInternationalAddress = useCallback((response, isAutocomplete = false) => {
		const result = response.result[0];
		const newState = {
			error: "",
			address1: result.address1,
			address2: result.address2,
			city: result.components.locality,
			state: result.components.administrativeArea,
			zipCode: result.components.postalCode,
		};

		setState(prevState => ({...prevState, ...newState}));
	}, []);

	return (
		<div>
			<div>
				<InputForm
					updateField={updateField}
					updateCheckbox={updateCheckbox}
					queryAutocompleteForSuggestions={queryAutocompleteForSuggestions}
					state={state}
					validateCallback={validateAddress}
				/>
				<Suggestions
					suggestions={state.suggestions}
					selectSuggestion={selectSuggestion}
				/>
			</div>
			{state.error &&
				<div>
					<h3>Validation Error:</h3>
					{state.error}
				</div>
			}
		</div>
	);
};

export default Autocomplete;