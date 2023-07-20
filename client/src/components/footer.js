import React, { useState } from "react";

export default function Footer() {
    const [contactUs, setcontactUs] = useState("Contact us");
    const [showPopup, setShowPopup] = useState(false);

    const copyemail =()=> {
        navigator.clipboard.writeText(contactUs);
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 2000);
    }

    return (
        <footer>
            <h3>CAN'T PUT A NAME TO IT? WE CAN</h3>
            <div>
                <button
                id="email"
               onClick={copyemail}
                onMouseEnter={()=>setcontactUs("hello@nametoit.com")}
                onMouseLeave={()=>setcontactUs("Contact us")}
                >
                {contactUs}
                </button>
                <div className={`popup ${showPopup ? 'show' : ''}`}>Email copied</div>
            </div>
        </footer>
        );
    };
