// La API tiene una copia en api/src/dominio/catalogo.js para validar categorías y cargar la semilla. Mantener ambas iguales.
export const CATEGORIAS = ['Juegos de mesa', 'Accesorios de escritorio'];

// Catálogo con el que se llena la tabla productos la primera vez que se inicia la API
export const PRODUCTOS_INICIALES = [
  {
    id: 1,
    title: 'Global Warning',
    price: 15990,
    category: 'Juegos de mesa',
    featured: true,
    description: 'Disfruta con tus amigos colaborando por un mundo más sano',
    image: '/assets/img/JuegoTabla3.jpg',
    images: [
      '/assets/img/JuegoTabla1.jpg',
      '/assets/img/JuegoTabla2.jpg',
      '/assets/img/JuegoTabla3.jpg',
    ],
  },
  {
    id: 2,
    title: 'Playmat',
    price: 12990,
    category: 'Accesorios de escritorio',
    featured: true,
    description: 'Maximiza la precisión de tu ratón y protege tu escritorio',
    image: '/assets/img/Playmat1.png',
    images: [
      '/assets/img/Playmat1.png',
      '/assets/img/Playmat2.png',
      '/assets/img/Playmat3.png',
    ],
    video: '/assets/vid/PlaymatVideo1.mp4',
  },
  {
    id: 3,
    title: 'Porta Lápices',
    price: 5990,
    category: 'Accesorios de escritorio',
    featured: false,
    description: 'Mantén ordenado tu escritorio, y luce a la moda',
    image: '/assets/img/Portalapices1.png',
    images: [
      '/assets/img/Portalapices1.png',
      '/assets/img/Portalapices2.png',
      '/assets/img/Portalapices3.png',
    ],
  },
];
