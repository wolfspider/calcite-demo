import { h } from "preact";
import style from "./style.css";

const Header = () => (
  <header class={style.header}>
    <a href="/" class={style.logo}>
      <calcite-icon icon="globe" />
      <h1>Alachua County Map</h1>
    </a>
  </header>
);

export default Header;
