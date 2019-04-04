import React, {Component} from "react";
import * as PropTypes from "prop-types";
import "./Suggestion.scss";

export default class Suggestion extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isHovered: false,
		};

		this.setIsHovered = this.setIsHovered.bind(this);
		this.buildResultHoverClass = this.buildResultHoverClass.bind(this);
	}

	setIsHovered(isHovered) {
		this.setState({isHovered});
	}

	buildResultHoverClass() {
		const className = "autocomplete--suggestion";
		return this.state.isHovered ? className + " autocomplete--suggestion-hover" : className;
	}

	render() {
		return (
			<div
				className={this.buildResultHoverClass()}
				onClick={this.props.selectSuggestion}
				onMouseEnter={() => this.setIsHovered(true)}
				onMouseLeave={() => this.setIsHovered(false)}
			>
				{this.props.suggestion.text}
			</div>
		);
	}
}

Suggestion.propTypes = {
	suggestion: PropTypes.any,
	selectSuggestion: PropTypes.func.isRequired,
};