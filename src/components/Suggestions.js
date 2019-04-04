import React from "react";
import Suggestion from "./Suggestion";

export default function Suggestions({suggestions, selectSuggestion}) {
	return <div className={"autocomplete--suggestions"}>
		{suggestions.map(suggestion => <Suggestion
			key={suggestion.text}
			suggestion={suggestion}
			selectSuggestion={() => selectSuggestion(suggestion)}
		/>)}
	</div>;
}