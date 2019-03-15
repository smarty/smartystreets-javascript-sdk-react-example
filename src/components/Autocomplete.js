import React from "react";
import * as SmartyStreetsSDK from "smartystreets-javascript-sdk";
import InputForm from "./InputForm";
import Suggestions from "./Suggestions";

export default class Autocomplete extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			shouldValidate: true,
			address1: "",
			address2: "",
			locality: "",
			province: "",
			postalCode: "",
			country: "US",
			suggestions: [],
		};

		const SmartyStreetsCore = SmartyStreetsSDK.core;
		const websiteKey = ""; // Your website key here
		const smartyStreetsSharedCredentials = new SmartyStreetsCore.SharedCredentials(websiteKey);
		const autoCompleteClientBuilder = new SmartyStreetsCore.ClientBuilder(smartyStreetsSharedCredentials);
		const usStreetClientBuilder = new SmartyStreetsCore.ClientBuilder(smartyStreetsSharedCredentials);
		const internationalStreetClientBuilder = new SmartyStreetsCore.ClientBuilder(smartyStreetsSharedCredentials);

		this.SmartyStreetsCore = SmartyStreetsCore;
		this.autoCompleteClient = autoCompleteClientBuilder.buildUsAutocompleteClient();
		this.usStreetClient = usStreetClientBuilder.buildUsStreetApiClient();
		this.internationalStreetClient = internationalStreetClientBuilder.buildInternationalStreetClient();

		this.updateField = this.updateField.bind(this);
		this.updateCheckbox = this.updateCheckbox.bind(this);
		this.queryAutocompleteForSuggestions = this.queryAutocompleteForSuggestions.bind(this);
		this.selectSuggestion = this.selectSuggestion.bind(this);
		this.updateStateFromValidatedUsAddress = this.updateStateFromValidatedUsAddress.bind(this);
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

	queryAutocompleteForSuggestions(query) {
		const lookup = new SmartyStreetsSDK.usAutocomplete.Lookup(query);

		this.autoCompleteClient.send(lookup)
			.then(response => {
				this.setState({suggestions: response.result});
			})
			.catch(console.warn);
	}

	selectSuggestion(suggestion) {
		this.useAutoCompleteSuggestion(suggestion)
			.then(() => {
				if (this.state.shouldValidate) this.validateAddress();
			});
	}

	useAutoCompleteSuggestion(suggestion) {
		return new Promise(resolve => {
			this.setState({
				address1: suggestion.streetLine,
				locality: suggestion.city,
				province: suggestion.state,
				suggestions: [],
			}, resolve);
		});
	}

	validateAddress() {
		if (this.state.country === "US") this.validateUsAddress();
		else this.validateInternationalAddress();
	}

	validateUsAddress() {
		let lookup = new SmartyStreetsSDK.usStreet.Lookup();
		lookup.street = this.state.address1;
		lookup.street2 = this.state.address2;
		lookup.city = this.state.locality;
		lookup.state = this.state.province;
		lookup.zipCode = this.state.postalCode;

		this.usStreetClient.send(lookup)
			.then(this.updateStateFromValidatedUsAddress)
			.catch(console.warn);
	}

	updateStateFromValidatedUsAddress(response) {
		const candidate = response.lookups[0].result[0];
		console.log(candidate);
		this.setState({
			address1: candidate.deliveryLine1,
			address2: candidate.deliveryLine2,
			city: candidate.components.cityName,
			state: candidate.components.state,
			postalCode: `${candidate.components.zipCode}-${candidate.components.plus4Code}`,
		});
	}

	validateInternationalAddress() {
		let lookup = new SmartyStreetsSDK.internationalStreet.Lookup();
		lookup.address1 = this.state.address1;
		lookup.address2 = this.state.address2;
		lookup.locality = this.state.locality;
		lookup.province = this.state.province;
		lookup.postalCode = this.state.postalCode;
		lookup.country = this.state.country;

		this.internationalStreetClient.send(lookup)
			.then(console.log)
			.catch(console.warn);
	}

	render() {
		return <div className={"autocomplete"}>
			<InputForm
				updateField={this.updateField}
				updateCheckbox={this.updateCheckbox}
				queryAutocompleteForSuggestions={this.queryAutocompleteForSuggestions}
				state={this.state}
			/>
			<Suggestions
				suggestions={this.state.suggestions}
				selectSuggestion={this.selectSuggestion}
			/>
		</div>;
	}
}