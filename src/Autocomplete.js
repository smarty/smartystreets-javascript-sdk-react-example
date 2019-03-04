import React from "react";
import * as SmartyStreetsSDK from "smartystreets-javascript-sdk";
import InputForm from "./InputForm";
import Suggestions from "./Suggestions";

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
			suggestions: [],
		};

		const SmartyStreetsCore = SmartyStreetsSDK.core;
		const websiteKey = ""; // Your website key here
		const smartyStreetsSharedCredentials = new SmartyStreetsCore.SharedCredentials(websiteKey);
		const clientBuilder = new SmartyStreetsCore.ClientBuilder(smartyStreetsSharedCredentials);

		this.Lookup = SmartyStreetsSDK.usAutocomplete.Lookup;
		this.client = clientBuilder.buildUsAutocompleteClient();

		this.updateField = this.updateField.bind(this);
		this.queryAutocompleteForSuggestions = this.queryAutocompleteForSuggestions.bind(this);
		this.selectSuggestion = this.selectSuggestion.bind(this);
	}

	updateField(e) {
		const newState = {};
		newState[e.target.name] = e.target.value;

		this.setState(newState);
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
		});
	}

	render() {
		return <div className={"autocomplete"}>
			<InputForm
				updateField={this.updateField}
				queryAutocompleteForSuggestions={this.queryAutocompleteForSuggestions}
				address1={this.state.address1}
				address2={this.state.address2}
				locality={this.state.locality}
				province={this.state.province}
				postalCode={this.state.postalCode}
				country={this.state.country}
			/>
			<Suggestions
				suggestions={this.state.suggestions}
				selectSuggestion={this.selectSuggestion}
			/>
		</div>;
	}
}