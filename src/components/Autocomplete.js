import React from "react";
import * as SmartySDK from "smartystreets-javascript-sdk";
import * as sdkUtils from "smartystreets-javascript-sdk-utils";
import InputForm from "./InputForm";
import Suggestions from "./Suggestions";

export default class Autocomplete extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			lookup: new SmartySDK.usAutocompletePro.Lookup,
			client: this.autoCompleteClient,
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
		};

		const SmartyCore = SmartySDK.core;
		const websiteKey = ""; // Your website key here
		const smartySharedCredentials = new SmartyCore.SharedCredentials(websiteKey);

		this.SmartyCore = SmartyCore;
		this.autoCompleteClient = new SmartyCore.ClientBuilder(smartySharedCredentials).withLicenses(["us-autocomplete-pro-cloud"]).buildUsAutocompleteProClient();
		this.internationalautocompleteClient = new SmartyCore.ClientBuilder(smartySharedCredentials).withLicenses(["international-autocomplete-v2-cloud"]).buildInternationalAddressAutocompleteClient();
		this.usStreetClient = new SmartyCore.ClientBuilder(smartySharedCredentials).buildUsStreetApiClient();
		this.internationalStreetClient = new SmartyCore.ClientBuilder(smartySharedCredentials).buildInternationalStreetClient();

		this.updateField = this.updateField.bind(this);
		this.updateCheckbox = this.updateCheckbox.bind(this);
		this.queryAutocompleteForSuggestions = this.queryAutocompleteForSuggestions.bind(this);
		this.selectSuggestion = this.selectSuggestion.bind(this);
		this.updateStateFromValidatedUsAddress = this.updateStateFromValidatedUsAddress.bind(this);
		this.validateAddress = this.validateAddress.bind(this);
		this.formatAutocompleteSuggestion = this.formatAutocompleteSuggestion.bind(this);
	}

	updateStateFromForm(key, value) {
		const newState = {};
		newState[key] = value;

		this.setState(newState);
	}

	updateField(e) {
		this.updateStateFromForm(e.target.id, e.target.value);
	}

	updateCheckbox(e) {
		this.updateStateFromForm(e.target.id, e.target.checked);
	}

	formatAutocompleteSuggestion(suggestion) {
		const addressText = suggestion.addressText ? `${suggestion.addressText} ` : "";
		const street = suggestion.streetLine ? `${suggestion.streetLine} ` : "";
		const secondary = suggestion?.secondary ? `${suggestion.secondary} ` : "";
		const entries = suggestion?.entries !== 0 ? `(${suggestion.entries}) ` : "";
		const city = suggestion?.city ? `${suggestion.city} ` : "";
		const state = suggestion?.state ? `${suggestion.state}, ` : "";
		const zip = suggestion?.zipcode ? `${suggestion.zipcode}` : "";

		return addressText + street + secondary + entries + city + state + zip;
	}

	queryAutocompleteForSuggestions(query, addressId, hasSecondaries=false) {
		if (this.state.country === "US") {
			this.lookup = new SmartySDK.usAutocompletePro.Lookup(query);
			this.client = this.autoCompleteClient;
			if (hasSecondaries) {
				this.lookup.selected = query;
			}
		} else {
			this.client = this.internationalautocompleteClient;
			if (hasSecondaries) {
				this.lookup = new SmartySDK.internationalAddressAutocomplete.Lookup({addressId: addressId});
			} else {
				this.lookup = new SmartySDK.internationalAddressAutocomplete.Lookup(query);
				this.lookup.search = query;
			}
		}
		this.lookup.country = this.state.country;

		this.client.send(this.lookup)
			.then(results => {
				this.setState({suggestions: results});
			})
			.catch(console.warn);
	}

	selectSuggestion(suggestion) {
		if (suggestion.entries > 1) {
			this.queryAutocompleteForSuggestions(this.formatAutocompleteSuggestion(suggestion), suggestion.addressId, true);
		} else {
			this.useAutoCompleteSuggestion(suggestion)
				.then(() => {
					if (this.state.shouldValidate) this.validateAddress();
				});
		}
	}

	useAutoCompleteSuggestion(suggestion) {
		if (this.state.country === "US") {
			return new Promise(resolve => {
				this.setState({
					address1: suggestion.streetLine,
					address2: suggestion.secondary,
					city: suggestion.city,
					state: suggestion.state,
					zipCode: suggestion.zipcode,
					suggestions: {result: []},
				}, resolve);
			});
		} else {
			return new Promise(resolve => {
				this.setState({
					freeform: suggestion.addressText,
				}, resolve);
			})
		}
	}

	validateAddress() {
		if (this.state.country === "US") {
			let lookup = new SmartySDK.usStreet.Lookup();
			lookup.street = this.state.address1;
			lookup.street2 = this.state.address2;
			lookup.city = this.state.city;
			lookup.state = this.state.state;
			lookup.zipCode = this.state.zipCode;

			if (!!lookup.street) {
				this.usStreetClient.send(lookup)
					.then((response) => this.updateStateFromValidatedUsAddress(response, true))
					.catch(e => this.setState({error: e.error}));
			} else {
				this.setState({error: "A street address is required."});
			}
		} else {
			let lookup = new SmartySDK.internationalStreet.Lookup();
			lookup.freeform = this.state.freeform;
			lookup.country = this.state.country;

			this.internationalStreetClient.send(lookup)
				.then((response) => this.updateStateFromValidatedInternationalAddress(response, true))
				.catch(e => this.setState({error: e.error}));
		}
	}

	updateStateFromValidatedUsAddress(response, isAutocomplete = false) {
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

		this.setState(newState);
	}

	updateStateFromValidatedInternationalAddress(response, isAutocomplete = false) {
		const result = response.result[0];
		const newState = {
			error: "",
		};

		newState.address1 = result.address1;
		newState.address2 = result.address2;
		newState.city = result.components.locality;
		newState.state = result.components.administrativeArea;
		newState.zipCode = result.components.postalCode;

		this.setState(newState);
	}

	render() {
		return <div>
			<div>
				<InputForm
					updateField={this.updateField}
					updateCheckbox={this.updateCheckbox}
					queryAutocompleteForSuggestions={this.queryAutocompleteForSuggestions}
					state={this.state}
					validateCallback={this.validateUsAddress}
				/>
				<Suggestions
					suggestions={this.state.suggestions}
					selectSuggestion={this.selectSuggestion}
				/>
			</div>
			{this.state.error &&
				<div>
					<h3>Validation Error:</h3>
					{this.state.error}
				</div>
			}
		</div>;
	}
}