import React, { useRef } from "react";
import "./App.css";
import { fromEvent } from "rxjs";
import { filter } from "rxjs/operators";
import Interpreter from "./interpreter";
import Visitor from "./visitor";
const acorn = require("acorn");

const App = () => {
	let [inputValue, setInputValue] = React.useState("");
	let [history, setHistory] = React.useState([]);
	let [inputValueHistory, setInputValueHistory] = React.useState([]);
	let recentValues = [];
	let pos = useRef(0);

	const inputRef = useRef(null);
	let consoleField = inputRef.current;
	const updateInputValue = () => {
		setInputValue(inputRef.current.value);
	};

	React.useEffect(() => {
		const createKeyUpShiftEnter$ = fromEvent(consoleField, "keyup").pipe(
			filter((e) => e.keyCode === 13 && !e.shiftKey)
		);
		const createKeyUpWithCustomKey = (htmlTag, KEYBOARD_KEY) =>
			fromEvent(htmlTag, "keyup").pipe(filter((e) => e.key === KEYBOARD_KEY));

		if (consoleField !== null || undefined) {
			createKeyUpShiftEnter$.subscribe((e) => {
				e.preventDefault();
			});

			let fieldWhileArrowUp = createKeyUpWithCustomKey(consoleField, "ArrowUp");
			let fieldWhileArrowDown = createKeyUpWithCustomKey(
				consoleField,
				"ArrowDown"
			);

			fieldWhileArrowUp.subscribe(() => {
				if (recentValues.length > 0 && pos.current >= 0) {
					setInputValue(
						recentValues[pos.current] ? recentValues[pos.current] : ""
					);
					pos.current = pos.current - 1;
				}
			});

			fieldWhileArrowDown.subscribe(() => {
				if (recentValues.length > 0 && pos.current < recentValues.length) {
					setInputValue(
						recentValues[pos.current] ? recentValues[pos.current] : ""
					);
					pos.current = pos.current + 1;
				}
			});
		}
	});

	const onEnter = (event) => {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			parseInput();
		}
	};

	const parseInput = () => {
		const value = inputRef.current.value.trim();
		let eValue = "";
		if (value) {
			if (!/(var|let|const)/.test(value)) {
				eValue = `print(${value})`;
			}
			try {
				const body = acorn.parse(eValue || value, { ecmaVersion: 2020 }).body;
				const jsInterpreter = new Interpreter(new Visitor());
				jsInterpreter.interpret(body);
				const answer = jsInterpreter.getValue();
				const finalResult = answer ? value + "    =  " + answer : value;
				setHistory((prevHistory) => [...prevHistory, finalResult]);
				setInputValueHistory((prevValue) => [...prevValue, value]);
				recentValues.push(...inputValueHistory, value);
				pos.current = recentValues.length; // intermiediatary
				setInputValue("");
			} catch {}
		}
	};

	const renderData = (item, index) => (
		<div key={index} style={{ height: "35px" }}>
			<span style={{ color: "red" }}>{"> "}</span>
			{item}
		</div>
	);

	return (
		<div className='App'>
			<div>
				<div>{history.length > 0 && history.map(renderData)}</div>
				<div className='app_console'>
					<span>{"> "}</span>
					<input
						id='console'
						ref={inputRef}
						value={inputValue}
						onChange={updateInputValue}
						onKeyDown={onEnter}
						autoFocus
					></input>
				</div>
			</div>
		</div>
	);
};

export default App;
