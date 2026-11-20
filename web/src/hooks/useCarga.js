import { useEffect, useState } from 'react';

// Ejecuta una carga asíncrona cuando cambian las dependencias y expone { datos, cargando, error }.
// Ignora la respuesta si el componente se desmontó o si las dependencias cambiaron antes de que llegara.
export function useCarga(cargar, dependencias) {
  const [estado, setEstado] = useState({ datos: null, cargando: true, error: '' });

  useEffect(() => {
    let vigente = true;
    setEstado({ datos: null, cargando: true, error: '' });
    cargar().then(
      (datos) => vigente && setEstado({ datos, cargando: false, error: '' }),
      (error) => vigente && setEstado({ datos: null, cargando: false, error: error.message }),
    );
    return () => {
      vigente = false;
    };
  }, dependencias);

  return estado;
}
