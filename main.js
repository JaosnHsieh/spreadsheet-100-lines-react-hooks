/**
 * all the code is based on below links with minor change
 * https://github.com/aosabook/500lines/blob/master/spreadsheet/code/as-react-livescript/main.ls
 * https://github.com/aosabook/500lines/tree/master/spreadsheet
 */

import React, { useState, useEffect } from "react";
import ReactDom from "react-dom";
const range = (cur, end) => {
  const result = [];
  while (cur <= end) {
    result.push(cur);
    cur = isNaN(cur) ? String.fromCodePoint(cur.codePointAt() + 1) : cur + 1;
  }
  return result;
};
const sheetDefault = {
  A1: 1874,
  B1: "+",
  C1: 2046,
  D1: "⇒",
  E1: "=A1+C1"
};

const initSheet = JSON.parse(localStorage.getItem("")) || sheetDefault;

const Sheet = props => {
  const [worker, setWorker] = useState(props.worker);
  const [sheet, setSheet] = useState(initSheet);
  const [vals, setVals] = useState(initSheet);
  const [errs, setErrs] = useState({});
  const [didMount, setDidMount] = useState(false);

  const rows = range(1, 20);
  const cols = range("A", "H");

  const calc = sheet => {
    setSheet(sheet);
    const timeout = setTimeout(() => {
      worker.terminate();
      setWorker(new Worker("worker.js"));
    }, 99);
    worker.onmessage = ({ data: [newErrs, newVals] }) => {
      clearTimeout(timeout);
      setErrs(newErrs);
      setVals(newVals);
      localStorage.setItem("", JSON.stringify(sheet));
    };
    worker.postMessage(sheet);
  };
  const reset = () => {
    calc(sheetDefault);
  };
  useEffect(() => {
    if (!didMount) {
      calc(sheet);
      setDidMount(true);
    }
  });

  return (
    <table>
      <tbody>
        <tr>
          <th>
            <button onClick={reset}>↻</button>
          </th>
          {cols.map((col, i) => (
            <th key={i}>{col}</th>
          ))}
        </tr>
        {rows.map((row, i) => (
          <tr key={i}>
            <th>{row}</th>
            {cols.map((col, j) => (
              <td
                key={j}
                className={
                  sheet[col + row] && sheet[col + row] === "=" ? "formula" : ""
                }
              >
                <input
                  id={`${col + row}`}
                  type="text"
                  value={sheet[col + row] || ""}
                  onChange={({ target: { id, value } }) => {
                    calc({ ...sheet, [id]: value });
                  }}
                  onKeyDown={({ which }) => {
                    switch (which) {
                      case 38:
                      case 40:
                      case 13:
                        const direction = which === 38 ? row - 1 : row + 1;
                        const cell = document.querySelector(
                          `#${col + direction}`
                        );
                        if (cell) {
                          cell.focus();
                        }
                    }
                  }}
                />
                <div
                  className={
                    errs[col + row] ? "err" : vals[col + row] ? "text" : ""
                  }
                >
                  {errs[col + row] || vals[col + row]}
                </div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

window.init = () => {
  const worker = new Worker("worker.js");
  worker.onmessage = () => {
    ReactDom.render(<Sheet worker={worker} />, document.getElementById("root"));
  };
  worker.postMessage(null);
};
