import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Result() {
  const [finalMessage, setfinalMessage] = useState("")
  const [buttonDisabled, setbuttonDisabled] = useState(false)
  const [button2Disabled, setbutton2Disabled] = useState(true)
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const gptResult = searchParams.get('res');

  const handleClick = (e) => {
    document.getElementById("fb-btns").classList.add("hidden")
    document.getElementById("thanks").classList.remove("hidden")
    setbuttonDisabled(true)
    setbutton2Disabled(false)
    setfinalMessage(e.id === "btn1" ? "Thanks for the feedback!" : "Sorry we didn't quite figure it out!")
  }

  return (
    <>
      <h1 id="result">did you mean: <span>{gptResult}</span></h1>
      <div class="feedback">
        <div id="fb-btns" onClick={handleClick}>
          <button className="btns" id="btn1" disabled={(buttonDisabled)}>Correct</button>
          <button className="btns" id="btn2" disabled={(buttonDisabled)}>Incorrect</button>
        </div>
        <div class="thanks hidden" id="thanks">
          <h2>{finalMessage}</h2>
          <button className="btns" disabled={button2Disabled} id="btn3" onClick={navigate("/")}>Restart</button>
        </div>
      </div>
    </>
  );
}