import { footballShowcaseBoard } from "./examples/football/football-showcase-board";
import { FootballBoardEditor } from "./react";

export default function App() {
  return <FootballBoardEditor initialBoard={footballShowcaseBoard} />;
}
