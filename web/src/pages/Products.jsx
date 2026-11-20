import { useState } from 'react';

import EstadoCarga from '../components/EstadoCarga';
import Filters from '../components/Filters';
import ProductGrid from '../components/ProductGrid';
import { useCart } from '../context/CartContext';
import { CATEGORIAS, filtrarPorCategoria, listarProductos } from '../data/productos';
import { useCarga } from '../hooks/useCarga';

const Products = () => {
  const { addToCart } = useCart();
  const [categoria, setCategoria] = useState('todas');
  const { datos, cargando, error } = useCarga(listarProductos, []);
  const productos = datos ?? [];
  const visibles = filtrarPorCategoria(productos, categoria);

  return (
    <div>
      <h2 className="mb-2">Catálogo Pixel &amp; Play</h2>
      <p className="text-muted mb-3">Juegos de mesa y accesorios de escritorio</p>

      <EstadoCarga cargando={cargando} error={error}>
        <Filters
          current={categoria}
          onChange={setCategoria}
          options={CATEGORIAS}
          total={productos.length}
        />

        <ProductGrid items={visibles} onAdd={addToCart} />
      </EstadoCarga>
    </div>
  );
};

export default Products;
