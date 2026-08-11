import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "../../css/Home.css";

function Home() {
 
  return (
    <div className="homeRoot">      
            <Header />
      {/* HERO */}
      <section className="heroSection">
        <div className="heroBlob heroBlobTopRight"></div>
        <div className="heroBlob heroBlobBottomLeft"></div>
        <div className="heroBlob heroBlobCenter"></div>

        <div className="heroInner">
            <h1>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed cursus, ex eget. </h1>
            
        </div>
      </section>

      {/* FLOATING NOTES */}
      
     
      <Footer />
    </div>
  );
}

export default Home;
