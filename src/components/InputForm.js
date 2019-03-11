import React from "react";
import "./InputForm.scss";
import inputFields from "../data/input_fields";
import {countries} from "../data/countries";

export default function InputForm({address1, address2, locality, province, postalCode, country, updateField, queryAutocompleteForSuggestions}) {
	return (
		<form className={"autocomplete--input-form"}>
			<div className={"autocomplete--input-group"}>
				<label
					className={"autocomplete--input-label"}
					htmlFor="address1"
				>
					Address 1
				</label>
				<input
					className={"autocomplete--input-field"}
					type="text"
					id={"address1"}
					value={address1}
					onChange={e => {
						updateField(e);
						queryAutocompleteForSuggestions(e.target.value);
					}}
				/>
			</div>
			<div className={"autocomplete--input-group"}>
				<label
					className={"autocomplete--input-label"}
					htmlFor="address2"
				>
					Address 2
				</label>
				<input
					className={"autocomplete--input-field"}
					type="text"
					id={"address2"}
					value={address2}
					onChange={updateField}
				/>
			</div>
			<div className={"autocomplete--input-group"}>
				<label
					className={"autocomplete--input-label"}
					htmlFor="locality"
				>
					City
				</label>
				<input
					className={"autocomplete--input-field"}
					type="text"
					id={"locality"}
					value={locality}
					onChange={updateField}
				/>
			</div>
			<div className={"autocomplete--input-group"}>
				<label
					className={"autocomplete--input-label"}
					htmlFor="province"
				>
					Province
				</label>
				<input
					className={"autocomplete--input-field"}
					type="text"
					id={"province"}
					value={province}
					onChange={updateField}
				/>
			</div>
			<div className={"autocomplete--input-group"}>
				<label
					className={"autocomplete--input-label"}
					htmlFor="postalCode"
				>
					Postal Code
				</label>
				<input
					className={"autocomplete--input-field"}
					type="text"
					id={"postalCode"}
					value={postalCode}
					onChange={updateField}
				/>
			</div>
			<div className={"autocomplete--input-group"}>
				<label
					className={"autocomplete--input-label"}
					htmlFor="country"
				>
					Country
				</label>
				<select
					value={state.country}
					onChange={updateField}
					id={"country"}
					className={"autocomplete--input-field"}
				>
					{countries.map(country => {
						return <option value={country.iso2} key={country.iso2}>{country.name}</option>;
					})}
				</select>
			</div>
		</form>
	);
}