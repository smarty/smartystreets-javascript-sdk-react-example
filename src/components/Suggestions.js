import React from "react";
import Suggestion from "./Suggestion";

export default function Suggestions({suggestions, selectSuggestion}) {
	const suggestionList = suggestions.result;

	return <div className={"autocomplete--suggestions"}>
		{suggestionList.map((suggestion, key) => <Suggestion
			key={key}
			suggestion={suggestion}
			selectSuggestion={() => selectSuggestion(suggestion)}
		/>)}
	</div>;
}