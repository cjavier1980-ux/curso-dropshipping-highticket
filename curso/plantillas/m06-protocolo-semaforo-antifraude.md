# Plantilla M06: Protocolo del Semáforo Antifraude para Tickets de US$150 a US$800

## Regla de Oro: Nunca despaches al proveedor sin pasar este filtro de 2 minutos

### 🟢 SEMÁFORO VERDE (Despacho inmediato)
- [ ] Riesgo de Shopify / Stripe marcado como **Low (Bajo)**.
- [ ] Dirección de facturación y envío coinciden (**AVS Match = Y**).
- [ ] Código CVV validado (**CVV Match = M**).
- [ ] Distancia entre IP del comprador y dirección de envío < 100 millas.

### 🟡 SEMÁFORO AMARILLO (Verificación telefónica obligatoria de 2 minutos)
- [ ] Dirección de envío es distinta a la de facturación (ej. contratista enviando a una obra o regalo familiar).
- [ ] Pedido superior a **US$500** de un cliente nuevo sin historial previo.
- **Guion de llamada de verificación (EN):** *"Hi [Name], this is [Your Name] from [Store]. Thank you for your order of the [Product]! Because this is a high-value shipment, we do a quick courtesy call to confirm your delivery address at [Address] and let you know it ships from our [State] warehouse within 48 hours. Does that address work best for receiving the package?"*
- **Guion de llamada de verificación (ES):** *"Hola [Nombre], te habla [Tu Nombre] de [Tienda]. ¡Muchas gracias por tu compra del [Producto]! Como es un envío de alto valor, siempre hacemos una llamada breve de seguridad para confirmar que la dirección [Dirección] es correcta para recibir a FedEx/UPS y avisarte que sale de bodega en 48 horas. ¿Es correcto ese domicilio?"*

### 🔴 SEMÁFORO ROJO (Cancelar y reembolsar de inmediato antes de despachar)
- [ ] El cliente usa un *Freight Forwarder* (casillero de reenvío internacional en Miami/Doral/Delaware) con tarjeta emitida en otro país y fallo de AVS.
- [ ] Múltiples intentos fallidos con distintas tarjetas de crédito antes de aprobar.
- [ ] Teléfono inválido o el titular dice no reconocer el cargo.
