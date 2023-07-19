import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {

  const [userInput, setuserInput] = useState("");
  const [characterCount, setcharacterCount] = useState(0);
  const navigate = useNavigate();

  const handleEvent =(e)=> {
    setcharacterCount(e.target.value.length);
    setuserInput(e.target.value);
    if (e.target.value.length < 251 && e.target.value.length >= 10) {
      document.getElementById("counter").style.color = "#00F260";
      document.getElementById("submit").disabled = false;
    } else {
      document.getElementById("counter").style.color = "#ff0000";
      document.getElementById("submit").disabled = true;
    };

  }

  async function onSubmit(e){
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:4000/api', {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({userInput: userInput}),
      });
        if (res.status !== 200) {
          throw res.error || new Error(`Request failed with status ${res.status}`)
        }
        const data = await res.json()
        navigate(`/result?res=${data.result}`)
      
    } catch(error) {
      console.error(error);
      alert(error.message);
    }
  }


  return (
      <form className="userform" onSubmit={onSubmit}>
        <div>
          <textarea
          placeholder="Use your words"
          onInput={handleEvent}
          value={userInput}>
          </textarea>
          <h6 id="counter"> {characterCount} <span> /250 </span> </h6>
        </div>
        <button disabled={true} id="submit">Submit</button>
      </form>
  );
};