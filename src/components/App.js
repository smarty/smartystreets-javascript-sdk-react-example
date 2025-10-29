import React from "react";
import { createRoot } from "react-dom/client";
import Autocomplete from "./Autocomplete";

import "./App.scss";

const App = () => {
	return <Autocomplete/>;
};

const container = document.getElementById("app");
const root = createRoot(container);
root.render(<App />);