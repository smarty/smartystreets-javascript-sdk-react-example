import React from "react";
import * as SmartyStreetsSDK from "smartystreets-javascript-sdk";
import InputForm from "./InputForm";

export default class Autocomplete extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			address1: "",
			address2: "",
			locality: "",
			province: "",
			postalCode: "",
			country: "",
		};

		const SmartyStreetsCore = SmartyStreetsSDK.core;
		const websiteKey = ""; // Your website key here
		const smartyStreetsSharedCredentials = new SmartyStreetsCore.SharedCredentials(websiteKey);
		const clientBuilder = new SmartyStreetsCore.ClientBuilder(smartyStreetsSharedCredentials);

		this.Lookup = SmartyStreetsSDK.usAutocomplete.Lookup;
		this.client = clientBuilder.buildUsAutocompleteClient();

		this.updateField = this.updateField.bind(this);
		this.queryAutocompleteForSuggestions = this.queryAutocompleteForSuggestions.bind(this);
	}

	updateField(e) {
		const newState = {};
		newState[e.target.name] = e.target.value;

		this.setState(newState);
	}

	queryAutocompleteForSuggestions(query) {
		const lookup = new this.Lookup(query);

		this.client.send(lookup)
			.then(console.log)
			.catch(console.warn);
	}

	render() {
		return <InputForm
			updateField={this.updateField}
			queryAutocompleteForSuggestions={this.queryAutocompleteForSuggestions}
		/>;
	}
}