from playwright.sync_api import Page, expect, sync_playwright
import os

def verify_quotation_flow(page: Page):
    # 1. Login
    page.goto("http://localhost:5173/login")
    page.wait_for_timeout(3000)
    page.get_by_placeholder("operador@sunpartners.com").fill("admin@sunpartners.com")
    page.get_by_placeholder("••••••••").fill("admin_password_123")
    page.get_by_role("button", name="Ingresar").click()
    page.wait_for_timeout(5000)

    # 2. Go to New Quotation
    page.goto("http://localhost:5173/cotizaciones/nueva")
    page.wait_for_timeout(5000)

    # Tab 1: Cliente
    page.get_by_placeholder("Ej: Lanzamiento Producto X").fill("Evento de Prueba Playwright")
    page.get_by_placeholder("Ej: Centro de Convenciones").fill("Sede Norte")

    # Check if there are clients, if not create one
    if page.locator("select").first.locator("option").count() <= 1:
        page.get_by_role("button", name="+ Nuevo Cliente").click()
        page.get_by_placeholder("Empresa").fill("Cliente Test")
        page.get_by_placeholder("NIT").fill("900.123.456-1")
        page.get_by_role("button", name="Guardar Cliente").click()
        page.wait_for_timeout(2000)

    page.locator("select").first.select_option(index=1)
    page.wait_for_timeout(1000)
    page.get_by_role("button", name="Siguiente Estación").click()

    # Tab 2: Fechas
    page.wait_for_timeout(1000)
    page.get_by_role("button", name="Siguiente Estación").click()

    # Tab 3: Calculadora
    page.wait_for_timeout(1000)
    page.get_by_role("button", name="add Añadir Equipo").click()
    page.wait_for_timeout(1000)
    # Ensure there is an inventory item
    if page.locator("select").nth(1).locator("option").count() <= 1:
        # If no inventory, this part might fail or skip
        pass
    else:
        page.locator("select").nth(1).select_option(index=1)
        page.get_by_placeholder("Cant").fill("5")
        page.get_by_placeholder("Precio").first.fill("150000")

    page.get_by_role("button", name="groups + Personal").click()
    page.wait_for_timeout(500)
    page.get_by_placeholder("Descripción del servicio...").fill("Coordinador de Luces")
    page.get_by_placeholder("Precio").last.fill("200000")

    page.wait_for_timeout(1000)
    page.get_by_role("button", name="Siguiente Estación").click()

    # Tab 4: Bitácora
    page.wait_for_timeout(1000)
    page.get_by_placeholder("Instrucciones especiales para el equipo").fill("Cuidado con el cableado del ala norte.")

    # Save
    page.get_by_role("button", name="Crear Cotización Maestro").click()
    page.wait_for_timeout(8000)

    # 3. Detail Page & Generate Link
    page.wait_for_selector("text=EVENTO DE PRUEBA PLAYWRIGHT")
    page.screenshot(path="detail_internal.png")

    page.get_by_role("button", name="send Enviar y Generar Link").click()
    page.wait_for_timeout(5000)

    # Open Portal
    with page.expect_popup() as popup_info:
        page.get_by_role("button", name="Ver Portal").click()
    public_page = popup_info.value
    public_page.wait_for_timeout(8000)

    # 4. Public Portal Verification
    expect(public_page.get_by_text("Términos y Condiciones")).to_be_visible()
    expect(public_page.get_by_text("EVENTO DE PRUEBA PLAYWRIGHT")).to_be_visible()
    public_page.screenshot(path="public_portal.png")

    # Request Changes
    public_page.get_by_role("button", name="chat_bubble Solicitar Ajustes").click()
    public_page.wait_for_timeout(2000)
    public_page.get_by_placeholder("Por favor, describe qué cambios necesitas").fill("Necesitamos bajar el costo del coordinador.")
    public_page.get_by_role("button", name="Enviar Solicitud").click()
    public_page.wait_for_timeout(5000)

    public_page.screenshot(path="final_confirmation.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="video")
        page = context.new_page()
        try:
            verify_quotation_flow(page)
        finally:
            context.close()
            browser.close()
