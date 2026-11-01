import { boardHexes } from '@dday/engine';
import { HexMap } from './map/HexMap';

const BOARD_HEXES = boardHexes();

export function App() {
  return <HexMap hexes={BOARD_HEXES} />;
}
