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
		const websiteKey = "10831590130710894"; // Your website key here
		const smartyStreetsSharedCredentials = new SmartyStreetsCore.SharedCredentials(websiteKey);
		const clientBuilder = new SmartyStreetsCore.ClientBuilder(smartyStreetsSharedCredentials);

		this.Lookup = SmartyStreetsSDK.usAutocomplete.Lookup;
		this.client = clientBuilder.buildUsAutocompleteClient();

		this.updateField = this.updateField.bind(this);
		this.updateCheckbox = this.updateCheckbox.bind(this);
		this.queryAutocompleteForSuggestions = this.queryAutocompleteForSuggestions.bind(this);
		this.selectSuggestion = this.selectSuggestion.bind(this);
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
		const lookup = new this.Lookup(query);

		this.client.send(lookup)
			.then(response => {
				this.setState({suggestions: response.result});
			})
			.catch(console.warn);
	}

	selectSuggestion(suggestion) {
		this.setState({
			address1: suggestion.streetLine,
			locality: suggestion.city,
			province: suggestion.state,
			suggestions: [],
		});
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