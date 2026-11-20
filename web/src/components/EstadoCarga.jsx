import { Alert, Spinner } from 'react-bootstrap';

// Muestra el indicador de carga o el error de una petición; si no hay ninguno de los dos, muestra children
export default function EstadoCarga({ cargando, error, children }) {
  if (cargando) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando…</span>
        </Spinner>
      </div>
    );
  }
  if (error) return <Alert variant="danger">{error}</Alert>;
  return children;
}
