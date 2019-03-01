import React from "react";

export default function InputForm({address1, address2, locality, province, postalCode, country, updateField, queryAutocompleteForSuggestions}) {
	return (
		<form>
			<label htmlFor="address1">Address 1</label>
			<input
				type="text"
				name={"address1"}
				value={address1}
				onChange={e => {
					updateField(e);
					queryAutocompleteForSuggestions(e.target.value);
				}}
			/>
			<label htmlFor="address2">Address 2</label>
			<input
				type="text"
				name={"address2"}
				value={address2}
				onChange={updateField}
			/>
			<label htmlFor="locality">City</label>
			<input
				type="text"
				name={"locality"}
				value={locality}
				onChange={updateField}
			/>
			<label htmlFor="province">Province</label>
			<input
				type="text"
				name={"province"}
				value={province}
				onChange={updateField}
			/>
			<label htmlFor="postalCode">Postal Code</label>
			<input
				type="text"
				name={"postalCode"}
				value={postalCode}
				onChange={updateField}
			/>
			<label htmlFor="country">Country</label>
			<input
				type="text"
				name={"country"}
				value={country}
				onChange={updateField}
			/>
		</form>
	);
}