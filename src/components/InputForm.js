import React from "react";
import "./InputForm.scss";
import inputFields from "../data/input_fields";
import {countries} from "../data/countries";

const InputForm = ({
	updateField,
	queryAutocompleteForSuggestions,
	formValues,
	shouldValidate,
	setShouldValidate,
	validateCallback
}) => {
	return (
		<form className="autocomplete--input-form">
			<div className="autocomplete--input-group">
				<label
					htmlFor="shouldValidate"
					className="autocomplete--input-label"
				>
					Validate on Selection
				</label>
				<input
					className="autocomplete--input-field"
					id="shouldValidate"
					type="checkbox"
					checked={shouldValidate}
					onChange={() => setShouldValidate(!shouldValidate)}
				/>
			</div>
			{inputFields.map(inputField => (
				<div className="autocomplete--input-group" key={inputField.fieldName}>
					<label
						className="autocomplete--input-label"
						htmlFor={inputField.fieldName}
					>
						{inputField.fieldLabel}
					</label>
					<input
						className="autocomplete--input-field"
						type="text"
						id={inputField.fieldName}
						value={formValues[inputField.fieldName]}
						onChange={e => {
							updateField(e);

							if (inputField.fieldName === "address1") {
								queryAutocompleteForSuggestions(e.target.value);
							}
						}}
					/>
				</div>
			))}
			<div className="autocomplete--input-group">
				<label
					className="autocomplete--input-label"
					htmlFor="country"
				>
					Country
				</label>
				<select
					value={formValues.country}
					onChange={updateField}
					id="country"
					className="autocomplete--input-field"
				>
					{countries.map(country => (
						<option value={country.iso2} key={country.iso2}>{country.name}</option>
					))}
				</select>
			</div>
			<button onClick={e => {
				e.preventDefault();
				validateCallback();
			}}>Validate</button>
		</form>
	);
};

export default InputForm;