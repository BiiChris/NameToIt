import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Result() {
  const [finalMessage, setfinalMessage] = useState("")
  const [feedbackVisible, setFeedbackVisible] = useState(true)
  const [thanksVisible, setThanksVisible] = useState(false)
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const gptResult = searchParams.get('res');

  const handleClick = (e) => {
    setFeedbackVisible(false)
    setThanksVisible(true)
    setfinalMessage(e.target.id === "btn1" ? "Thanks for the feedback!" : "Sorry we didn't quite figure it out!")
  }

  return (
    <>
      <h1 id="result">did you mean: <span>{gptResult}</span></h1>
      <div className="feedback">
        {feedbackVisible && (
          <div id="fb-btns" onClick={handleClick}>
            <button className="btns" id="btn1">Correct</button>
            <button className="btns" id="btn2">Incorrect</button>
          </div>
        )}
        {thanksVisible && (
          <div className="thanks" id="thanks">
            <h2>{finalMessage}</h2>
            <button className="btns" id="btn3" onClick={() => navigate("/")}>Restart</button>
          </div>
        )}
      </div>
    </>
  );
}
