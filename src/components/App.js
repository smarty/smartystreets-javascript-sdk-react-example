import React from "react";
import ReactDOM from "react-dom";
import Autocomplete from "./Autocomplete";

import "./App.scss";

const App = () => {
	return <Autocomplete/>;
};

ReactDOM.render(<App/>, document.getElementById("app"));