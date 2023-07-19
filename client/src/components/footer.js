import React, { useState } from "react";

export default function Footer() {
    const [contactUs, setcontactUs] = useState("Contact us")

    const copyemail =()=> {
        navigator.clipboard.writeText(contactUs)
        alert('Email copied')
    }

    return (
        <footer>
            <h3>CAN'T PUT A NAME TO IT? WE CAN</h3>
            <button
            id="email"
            onClick={copyemail}
            onMouseEnter={()=>setcontactUs("hello@nametoit.com")}
            onMouseLeave={()=>setcontactUs("Contact us")}
            >
            {contactUs}
            </button>
        </footer>
        )
    };