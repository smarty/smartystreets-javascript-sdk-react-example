import React from "react";
import * as SmartySDK from "smartystreets-javascript-sdk";
import * as sdkUtils from "smartystreets-javascript-sdk-utils";
import InputForm from "./InputForm";
import Suggestions from "./Suggestions";

export default class Autocomplete extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			shouldValidate: true,
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
		const autoCompleteClientBuilder = new SmartyCore.ClientBuilder(smartySharedCredentials).withLicenses(["us-autocomplete-pro-cloud"]);
		const usStreetClientBuilder = new SmartyCore.ClientBuilder(smartySharedCredentials);

		this.SmartyCore = SmartyCore;
		this.autoCompleteClient = autoCompleteClientBuilder.buildUsAutocompleteProClient();
		this.usStreetClient = usStreetClientBuilder.buildUsStreetApiClient();

		this.updateField = this.updateField.bind(this);
		this.updateCheckbox = this.updateCheckbox.bind(this);
		this.queryAutocompleteForSuggestions = this.queryAutocompleteForSuggestions.bind(this);
		this.selectSuggestion = this.selectSuggestion.bind(this);
		this.updateStateFromValidatedUsAddress = this.updateStateFromValidatedUsAddress.bind(this);
		this.validateUsAddress = this.validateUsAddress.bind(this);
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
		const street = suggestion.streetLine ? `${suggestion.streetLine} ` : "";
		const secondary = suggestion?.secondary ? `${suggestion.secondary} ` : "";
		const entries = suggestion?.entries !== 0 ? `(${suggestion.entries}) ` : "";
		const city = suggestion?.city ? `${suggestion.city} ` : "";
		const state = suggestion?.state ? `${suggestion.state}, ` : "";
		const zip = suggestion?.zipcode ? `${suggestion.zipcode}` : "";

		return street + secondary + entries + city + state + zip;
	}

	queryAutocompleteForSuggestions(query, hasSecondaries=false) {
		const lookup = new SmartySDK.usAutocompletePro.Lookup(query);
		
		if (hasSecondaries) {
			lookup.selected = query;
		}
		console.log(lookup);
		this.autoCompleteClient.send(lookup)
			.then(results => {
				this.setState({suggestions: results});
			})
			.catch(console.warn);
	}

	selectSuggestion(suggestion) {		
		if (suggestion.entries > 1) {
			this.queryAutocompleteForSuggestions(this.formatAutocompleteSuggestion(suggestion), true);
		} else {
			this.useAutoCompleteSuggestion(suggestion)
				.then(() => {
					if (this.state.shouldValidate) this.validateUsAddress();
				});
		}
	}

	useAutoCompleteSuggestion(suggestion) {
		console.log("suggestion: ", suggestion);
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
	}

	validateUsAddress() {
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