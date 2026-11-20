import { Alert, Card } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

import EstadoCarga from '../components/EstadoCarga';
import UserIcon from '../components/UserIcon';
import { useAuth } from '../context/AuthContext';
import { listarMisCompras } from '../data/compras';
import { useCarga } from '../hooks/useCarga';
import { formatearNumeroBoleta, generarBoletaTexto } from '../utils/boleta';

const Profile = () => {
  const { usuario, token } = useAuth();
  const location = useLocation();
  const compraNumero = location.state?.compraNumero;
  const { datos, cargando, error } = useCarga(
    () => (token ? listarMisCompras(token) : Promise.resolve([])),
    [token],
  );
  const historial = datos ?? [];

  if (!usuario) {
    return (
      <div className="text-center py-5">
        <h2>Mi perfil</h2>
        <p className="text-muted">
          <Link to="/login">Inicia sesión</Link> para ver tu perfil y tu historial de compras.
        </p>
      </div>
    );
  }

  return (
    <div className="perfil-pp mx-auto">
      <h2>Mi perfil</h2>

      <div className="d-flex align-items-center gap-3 mb-4">
        <span className="perfil-icono"><UserIcon size={48} /></span>
        <div>
          <div className="fw-semibold">{usuario.nombre}</div>
          <div className="text-muted">{usuario.email}</div>
        </div>
      </div>

      {compraNumero && (
        <Alert variant="success">
          Compra realizada. Boleta N° {formatearNumeroBoleta(compraNumero)}.
        </Alert>
      )}

      <h3 className="h5 mb-3">Historial de compras</h3>
      <EstadoCarga cargando={cargando} error={error}>
        {historial.length === 0 ? (
          <p className="text-muted">Aún no tienes compras.</p>
        ) : (
          historial.map((compra) => (
            <Card key={compra.numero} className="mb-3 shadow-sm">
              <Card.Body>
                <pre className="boleta mb-0" aria-label={`Boleta N° ${formatearNumeroBoleta(compra.numero)}`}>
                  {generarBoletaTexto(compra)}
                </pre>
              </Card.Body>
            </Card>
          ))
        )}
      </EstadoCarga>
    </div>
  );
};

export default Profile;
