import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
const PASSWORD = 'Racer2001.';

// Helpers RNG
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const choice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  console.log('🌱 Seeding...');
  const hash = await bcrypt.hash(PASSWORD, 12);

  // ── Roles + Usuarios ──
  const adminRol = await prisma.rol.upsert({ where: { id: 1 }, update: {}, create: { nombre: 'admin' } });
  const workerRol = await prisma.rol.upsert({ where: { id: 2 }, update: {}, create: { nombre: 'worker' } });

  const adminUser = await prisma.usuario.upsert({
    where: { correo: 'admin@dreamlife.com' }, update: { contrasena: hash },
    create: { nombre: 'Administrador', correo: 'admin@dreamlife.com', contrasena: hash, rolId: adminRol.id },
  });
  const workerUser = await prisma.usuario.upsert({
    where: { correo: 'worker@dreamlife.com' }, update: { contrasena: hash },
    create: { nombre: 'Trabajador', correo: 'worker@dreamlife.com', contrasena: hash, rolId: workerRol.id },
  });

  // ── Ubicaciones ──
  const l1 = await prisma.ubicacion.upsert({ where: { id: 1 }, update: {}, create: { nombre: 'Tienda Central — Lima', tipo: 'tienda', ciudad: 'Lima', activa: true } });
  const l2 = await prisma.ubicacion.upsert({ where: { id: 2 }, update: {}, create: { nombre: 'Tienda Miraflores', tipo: 'tienda', ciudad: 'Lima', activa: true } });
  const al = await prisma.ubicacion.upsert({ where: { id: 3 }, update: {}, create: { nombre: 'Almacén Principal', tipo: 'almacen', ciudad: 'Lima', activa: true } });
  const online = await prisma.ubicacion.upsert({ where: { id: 4 }, update: {}, create: { nombre: 'Tienda Online', tipo: 'online', ciudad: 'Lima', activa: true } });

  // ── Categorías ──
  const cAnime = await prisma.categoria.upsert({ where: { slug: 'anime' }, update: {}, create: { nombre: 'Anime', slug: 'anime' } });
  const cCam = await prisma.categoria.upsert({ where: { slug: 'camisetas' }, update: {}, create: { nombre: 'Camisetas', slug: 'camisetas', padreId: cAnime.id } });
  const cFig = await prisma.categoria.upsert({ where: { slug: 'figuras' }, update: {}, create: { nombre: 'Figuras', slug: 'figuras', padreId: cAnime.id } });
  const cAcc = await prisma.categoria.upsert({ where: { slug: 'accesorios' }, update: {}, create: { nombre: 'Accesorios', slug: 'accesorios', padreId: cAnime.id } });
  const cMng = await prisma.categoria.upsert({ where: { slug: 'manga' }, update: {}, create: { nombre: 'Manga', slug: 'manga', padreId: cAnime.id } });

  // ── Productos + Items ──
  let pId = 0, vId = 0, dId = 0, iId = 0;
  const img = (t: string, color = '111111') => `https://placehold.co/600x600/${color}/FFFFFF?text=${encodeURIComponent(t)}&font=montserrat`;

  const itemsCreados: { id: number; sku: string; precio: number; nombre: string }[] = [];

  async function crear(d: { nombre: string; desc: string; precio: number; catId: number; dest?: boolean; talla: string; mat: string; serie: string; pers: string; dis: string; cat: string; sku: string; s1: number; s2?: number; sa?: number; imagen?: string; }) {
    pId++; vId++; dId++; iId++;
    const prod = await prisma.producto.upsert({ where: { id: pId }, update: {}, create: { nombre: d.nombre, descripcion: d.desc, precioBase: d.precio, activo: true, destacado: d.dest ?? false, categoriaId: d.catId } });
    await prisma.imagen.upsert({ where: { id: iId }, update: {}, create: { url: d.imagen ?? img(d.serie), productoId: prod.id, orden: 0 } });
    const v = await prisma.variante.upsert({ where: { id: vId }, update: {}, create: { productoId: prod.id, tamano: d.talla, material: d.mat, precioExtra: 0 } });
    const ds = await prisma.diseno.upsert({ where: { id: dId }, update: {}, create: { categoria: d.cat, serie: d.serie, personaje: d.pers, nombre: d.dis } });
    const item = await prisma.productoItem.upsert({ where: { codigoSku: d.sku }, update: {}, create: { codigoSku: d.sku, productoId: prod.id, varianteId: v.id, disenoId: ds.id, activo: true } });
    await prisma.stock.upsert({ where: { itemId_ubicacionId: { itemId: item.id, ubicacionId: l1.id } }, update: {}, create: { itemId: item.id, ubicacionId: l1.id, cantidad: d.s1 } });
    if (d.s2 != null) await prisma.stock.upsert({ where: { itemId_ubicacionId: { itemId: item.id, ubicacionId: l2.id } }, update: {}, create: { itemId: item.id, ubicacionId: l2.id, cantidad: d.s2 } });
    if (d.sa != null) await prisma.stock.upsert({ where: { itemId_ubicacionId: { itemId: item.id, ubicacionId: al.id } }, update: {}, create: { itemId: item.id, ubicacionId: al.id, cantidad: d.sa } });
    itemsCreados.push({ id: item.id, sku: d.sku, precio: d.precio, nombre: d.nombre });
  }

  await crear({ nombre: 'Camiseta Naruto Shippuden — Modo Sennin', desc: 'Camiseta premium con diseño oficial. 100% algodón ring-spun.', precio: 45, catId: cCam.id, dest: true, talla: 'M', mat: 'Algodón 100%', serie: 'Naruto Shippuden', pers: 'Naruto', dis: 'Modo Sennin', cat: 'Shonen', sku: 'NRT-M-001', s1: 30, s2: 20, sa: 50, imagen: img('Naruto', 'D97706') });
  await crear({ nombre: 'Camiseta Dragon Ball Z — Goku SSJ', desc: 'Diseño épico de Goku Super Saiyan.', precio: 45, catId: cCam.id, dest: true, talla: 'L', mat: 'Algodón 100%', serie: 'Dragon Ball Z', pers: 'Goku', dis: 'Super Saiyan', cat: 'Shonen', sku: 'DBZ-L-001', s1: 20, s2: 15, sa: 40, imagen: img('DBZ', 'F59E0B') });
  await crear({ nombre: 'Camiseta Attack on Titan — Survey Corps', desc: 'Cuerpo de Reconocimiento. Bordado del emblema.', precio: 49.9, catId: cCam.id, dest: true, talla: 'M', mat: 'Algodón Premium', serie: 'Attack on Titan', pers: 'Eren', dis: 'Survey Corps', cat: 'Shonen', sku: 'AOT-M-001', s1: 15, s2: 10, sa: 30, imagen: img('AOT', '92400E') });
  await crear({ nombre: 'Camiseta One Piece — Luffy Gear 5', desc: 'Luffy en su forma definitiva.', precio: 42, catId: cCam.id, talla: 'M', mat: 'Algodón 100%', serie: 'One Piece', pers: 'Luffy', dis: 'Gear 5', cat: 'Shonen', sku: 'OP-M-001', s1: 25, s2: 18, sa: 35, imagen: img('One Piece', 'B91C1C') });
  await crear({ nombre: 'Camiseta Demon Slayer — Tanjiro', desc: 'Diseño de Tanjiro con respiración del agua.', precio: 47, catId: cCam.id, dest: true, talla: 'M', mat: 'Algodón Ring-Spun', serie: 'Demon Slayer', pers: 'Tanjiro', dis: 'Water Breathing', cat: 'Shonen', sku: 'DS-M-001', s1: 12, s2: 8, sa: 20, imagen: img('Demon Slayer', '0EA5E9') });
  await crear({ nombre: 'Camiseta My Hero Academia — Deku', desc: 'Izuku Midoriya al 100% One For All.', precio: 44, catId: cCam.id, talla: 'L', mat: 'Algodón 100%', serie: 'My Hero Academia', pers: 'Deku', dis: 'Detroit Smash', cat: 'Shonen', sku: 'MHA-L-001', s1: 10, s2: 8, sa: 15, imagen: img('MHA', '16A34A') });
  await crear({ nombre: 'Figura Goku Super Saiyan 18cm', desc: 'Figura coleccionable PVC premium.', precio: 89.9, catId: cFig.id, dest: true, talla: 'Única', mat: 'PVC Premium', serie: 'Dragon Ball Z', pers: 'Goku', dis: 'SSJ Battle', cat: 'Shonen', sku: 'FIG-DBZ-001', s1: 6, s2: 4, sa: 10, imagen: img('Figura Goku', 'EAB308') });
  await crear({ nombre: 'Figura Itachi Uchiha — Mangekyo', desc: 'Figura premium con Sharingan.', precio: 95, catId: cFig.id, dest: true, talla: 'Única', mat: 'PVC Premium', serie: 'Naruto', pers: 'Itachi', dis: 'Mangekyo', cat: 'Shonen', sku: 'FIG-NRT-002', s1: 4, s2: 3, sa: 8, imagen: img('Itachi', '7C2D12') });
  await crear({ nombre: 'Llavero Totoro — Studio Ghibli', desc: 'Adorable llavero PVC suave.', precio: 18, catId: cAcc.id, talla: 'Única', mat: 'PVC Suave', serie: 'Totoro', pers: 'Totoro', dis: 'Totoro Sonriente', cat: 'Ghibli', sku: 'ACC-GHB-001', s1: 40, s2: 30, sa: 50, imagen: img('Totoro', '64748B') });
  await crear({ nombre: 'Póster Evangelion — Unidad 01', desc: 'Póster alta resolución, papel 250gr, A2.', precio: 25, catId: cAcc.id, talla: 'A2', mat: 'Papel Fotográfico', serie: 'Evangelion', pers: 'Eva 01', dis: 'Unit 01', cat: 'Mecha', sku: 'POS-EVA-001', s1: 20, s2: 15, sa: 25, imagen: img('Evangelion', '7E22CE') });
  await crear({ nombre: 'Manga Berserk Vol. 1', desc: 'Tapa dura con páginas a color.', precio: 55, catId: cMng.id, talla: 'Única', mat: 'Papel Premium', serie: 'Berserk', pers: 'Guts', dis: 'Black Swordsman', cat: 'Seinen', sku: 'MNG-BSK-001', s1: 8, s2: 6, sa: 12, imagen: img('Berserk', '292524') });
  await crear({ nombre: 'Taza Jujutsu Kaisen — Gojo', desc: 'Taza cerámica 350ml.', precio: 29.9, catId: cAcc.id, dest: true, talla: '350ml', mat: 'Cerámica', serie: 'JJK', pers: 'Gojo', dis: 'Infinity Blue', cat: 'Shonen', sku: 'ACC-JJK-001', s1: 15, s2: 12, sa: 20, imagen: img('Gojo', '3B82F6') });

  // ── Clientes ──
  const c1 = await prisma.cliente.upsert({
    where: { correo: 'cliente@demo.com' }, update: { contrasena: hash },
    create: { nombre: 'Carlos', apellido: 'García', dni: '45678912', correo: 'cliente@demo.com', telefono: '+51 999 888 777', direccion: 'Av. Larco 1234, Miraflores, Lima', contrasena: hash, puntos: 350, nivel: 'PLATA' },
  });
  const c2 = await prisma.cliente.upsert({
    where: { correo: 'ana@demo.com' }, update: { contrasena: hash },
    create: { nombre: 'Ana', apellido: 'Martínez', dni: '12345678', correo: 'ana@demo.com', telefono: '+51 988 777 666', direccion: 'Calle Las Flores 567, San Isidro, Lima', contrasena: hash, puntos: 1200, nivel: 'ORO' },
  });

  // ── 💰 GENERAR VENTAS DEMO de los últimos 120 días ──
  // Borrar ventas previas para evitar duplicados al re-ejecutar el seed
  await prisma.ventaDetalle.deleteMany({ where: { venta: { notas: { contains: '[DEMO]' } } } });
  await prisma.pago.deleteMany({ where: { venta: { notas: { contains: '[DEMO]' } } } });
  await prisma.venta.deleteMany({ where: { notas: { contains: '[DEMO]' } } });
  await prisma.gasto.deleteMany({ where: { descripcion: { contains: '[DEMO]' } } });

  console.log('💰 Generando ventas demo (~120 días)...');
  const canales = ['ONLINE', 'TIENDA', 'EVENTO'] as const;
  const estados = ['ENTREGADO', 'ENTREGADO', 'ENTREGADO', 'CONFIRMADA', 'EN_PREPARACION', 'ENVIADO'] as const;
  const metodos = ['YAPE', 'TARJETA', 'EFECTIVO', 'PLIN'];
  const clientes = [c1.id, c2.id];

  let ventasCount = 0;
  for (let diasAtras = 0; diasAtras < 120; diasAtras++) {
    // Más ventas los fines de semana y en días recientes
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - diasAtras);
    const esFinde = fecha.getDay() === 0 || fecha.getDay() === 6;
    const factorTiempo = diasAtras < 30 ? 1.2 : diasAtras < 60 ? 1 : 0.7; // últimos meses con más ventas
    let ventasPorDia = Math.round((esFinde ? rand(3, 7) : rand(1, 4)) * factorTiempo);

    for (let v = 0; v < ventasPorDia; v++) {
      const hora = rand(9, 21);
      const minuto = rand(0, 59);
      const ventaFecha = new Date(fecha);
      ventaFecha.setHours(hora, minuto, rand(0, 59), 0);

      const canal = choice([...canales]);
      const estado = choice([...estados]);
      const numItems = rand(1, 3);
      const detalles: { itemId: number; cantidad: number; precio: number }[] = [];
      const usados = new Set<number>();
      let subtotal = 0;
      for (let n = 0; n < numItems; n++) {
        let item = choice(itemsCreados);
        // Evitar duplicar mismo item en una venta
        let tries = 0;
        while (usados.has(item.id) && tries < 5) { item = choice(itemsCreados); tries++; }
        usados.add(item.id);
        const cantidad = rand(1, 3);
        detalles.push({ itemId: item.id, cantidad, precio: item.precio });
        subtotal += item.precio * cantidad;
      }

      const ubicacionId = canal === 'ONLINE' ? online.id : rand(0, 1) === 0 ? l1.id : l2.id;
      const venta = await prisma.venta.create({
        data: {
          clienteId: rand(0, 4) < 3 ? choice(clientes) : null, // 60% con cliente, 40% anónima
          usuarioId: canal === 'TIENDA' ? workerUser.id : null,
          ubicacionId,
          estado: estado as any,
          canal: canal as any,
          total: subtotal,
          notas: '[DEMO]',
          createdAt: ventaFecha,
          updatedAt: ventaFecha,
          detalles: { create: detalles.map((d) => ({ itemId: d.itemId, cantidad: d.cantidad, precioBase: d.precio, precioVendido: d.precio })) },
          pagos: { create: [{ metodo: choice(metodos), monto: subtotal, createdAt: ventaFecha }] },
        },
      });
      ventasCount++;
    }
  }
  console.log(`✅ ${ventasCount} ventas demo creadas`);

  // ── 💸 GENERAR GASTOS DEMO ──
  console.log('💸 Generando gastos demo...');
  const categoriasGasto = [
    { cat: 'inventario', descs: ['Compra mercadería proveedor JP', 'Reposición figuras Naruto', 'Restock camisetas DBZ'], rango: [400, 1800] },
    { cat: 'alquiler', descs: ['Alquiler Tienda Central', 'Alquiler Tienda Miraflores'], rango: [1500, 2500] },
    { cat: 'servicios', descs: ['Luz tienda', 'Agua', 'Internet fibra', 'Teléfono'], rango: [80, 250] },
    { cat: 'marketing', descs: ['Publicidad Instagram', 'TikTok ads', 'Influencer marketing'], rango: [150, 600] },
    { cat: 'sueldos', descs: ['Sueldo personal ventas', 'Bono trabajador'], rango: [800, 1500] },
    { cat: 'logistica', descs: ['Olva courier envíos', 'Shalom transporte', 'Embalaje y empaque'], rango: [80, 400] },
    { cat: 'otros', descs: ['Útiles oficina', 'Limpieza tienda'], rango: [40, 200] },
  ];
  let gastosCount = 0;
  for (let diasAtras = 0; diasAtras < 120; diasAtras++) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - diasAtras);
    // 1-3 gastos por día con probabilidades variables
    const numGastos = rand(0, 3);
    for (let g = 0; g < numGastos; g++) {
      const c = choice(categoriasGasto);
      const monto = rand(c.rango[0], c.rango[1]);
      const gFecha = new Date(fecha);
      gFecha.setHours(rand(8, 18), rand(0, 59), 0, 0);
      await prisma.gasto.create({
        data: {
          descripcion: `[DEMO] ${choice(c.descs)}`,
          monto,
          categoria: c.cat,
          ubicacionId: rand(0, 2) === 0 ? l1.id : l2.id,
          usuarioId: adminUser.id,
          createdAt: gFecha,
        },
      });
      gastosCount++;
    }
    // Gasto fijo mensual de alquiler (cada 30 días)
    if (diasAtras % 30 === 0 && diasAtras > 0) {
      await prisma.gasto.create({
        data: {
          descripcion: '[DEMO] Alquiler local mensual',
          monto: 2200,
          categoria: 'alquiler',
          ubicacionId: l1.id,
          usuarioId: adminUser.id,
          createdAt: fecha,
        },
      });
      gastosCount++;
    }
  }
  console.log(`✅ ${gastosCount} gastos demo creados`);

  console.log('');
  console.log('✅ Seed completado!');
  console.log('🔑 Contraseña común: Racer2001.');
  console.log('   admin@dreamlife.com   / Racer2001.');
  console.log('   worker@dreamlife.com  / Racer2001.');
  console.log('   cliente@demo.com      / Racer2001.');
  console.log('   ana@demo.com          / Racer2001.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
