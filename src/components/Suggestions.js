import React from "react";
import Suggestion from "./Suggestion";

const Suggestions = ({ suggestions, selectSuggestion }) => {
	const suggestionList = suggestions.result;

	return (
		<div className="autocomplete--suggestions">
			{suggestionList.map((suggestion, index) => (
				<Suggestion
					key={index}
					suggestion={suggestion}
					selectSuggestion={() => selectSuggestion(suggestion)}
				/>
			))}
		</div>
	);
};

export default Suggestions;