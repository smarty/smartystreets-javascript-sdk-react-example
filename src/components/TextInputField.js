import React from "react";

const TextInputField = ({inputField, state, queryAutocompleteForSuggestions, updateField}) => {
	return (
		<div className={"autocomplete--input-group"} key={inputField.fieldName}>
			<label
				className={"autocomplete--input-label"}
				htmlFor={inputField.fieldName}
			>
				{inputField.fieldLabel}
			</label>
			<input
				className={"autocomplete--input-field"}
				type="text"
				id={inputField.fieldName}
				value={state[inputField.fieldName]}
				onChange={e => {
					updateField(e);
					queryAutocompleteForSuggestions(e.target.value);
				}}
			/>
		</div>
	);
};

export default TextInputField;