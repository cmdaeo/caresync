/*
 * ============================================================================
 *  CARESYNC — FIRMWARE COMPLETO
 *  Comunicação bidirecional App <-> Caixa + RFID/Pulseira
 * ============================================================================
 *
 *  Placa  : Raspberry Pi Pico WH  (Earle Philhower RP2040 core >= 4.x)
 *
 *  DEFINIÇÕES OBRIGATÓRIAS NO ARDUINO IDE ANTES DE COMPILAR
 *  ─────────────────────────────────────────────────────────
 *  Tools -> Board              -> "Raspberry Pi Pico W"
 *  Tools -> IP/Bluetooth Stack -> "IPv4 + Bluetooth"
 *
 *  BIBLIOTECAS NECESSÁRIAS (Library Manager)
 *  ─────────────────────────────────────────
 *  - AccelStepper        (Mike McCauley)
 *  - LiquidCrystal_I2C   (Frank de Brabander)
 *  - Ds1302              (Rafa Couto)
 *  - MFRC522             (GithubCommunity)
 *  - BTstackLib          (incluída no core Philhower — sem instalação)
 *
 *  HARDWARE / PINAGEM
 *  ──────────────────
 *  RGB       : R=GP15, G=GP14, B=GP13
 *  Buzzer    : GP0
 *  Motor     : IN1=GP9, IN2=GP8, IN3=GP7, IN4=GP6  (ULN2003)
 *  Encoder   : CLK=GP1, DT=GP2, SW=GP3
 *  Reed      : GP18  (INPUT_PULLUP — LOW = íman / gaveta fechada)
 *  LCD I2C   : SDA=GP16, SCL=GP17  (endereço 0x27)
 *  RTC DS1302: CLK=GP10, DAT=GP11, RST=GP12
 *  RC522 SPI : SCK=GP22, MOSI=GP19, MISO=GP20, CS=GP21, RST=GP28
 *              VCC -> rail externo 3.3V (NUNCA 5V)
 *
 *  BLE — Características
 *  ─────────────────────
 *  Service : a1b2c3d4-e5f6-7890-abcd-ef1234567890
 *  ...7891  Motor       READ+WRITE
 *  ...7892  Eventos     READ+NOTIFY  (MED_TOMADA, MED_IGNORADA, RESTOCK)
 *  ...7893  AppConfig   WRITE        (MED|nome|seg|dias, RESET, RESTOCK_RESET)
 *  ...7894  Stats       READ         (STATS|pontuais|atrasadas|ignoradas|stock)
 *  ...7895  RfidSync    READ+NOTIFY  (SYNC|HHMM|..., RFID|UNKNOWN|uid)
 *
 *  NOTA SOBRE OS TESTES
 *  ────────────────────
 *  Intervalo em SEGUNDOS para testes rápidos.
 *  Produção: mudar * 1000UL para * 60000UL em estadoEspera() e estadoAguardaFecho()
 *
 *  CARACTERES CUSTOMIZADOS LCD (slots 0-7)
 *  ────────────────────────────────────────
 *  0: Metade esquerda da cápsula
 *  1: Metade direita da cápsula
 *  2: Ícone de gráfico (linha a subir)
 *  3: Barra de progresso vazia  [ ]
 *  4: Barra de progresso 1/3    [=  ]
 *  5: Barra de progresso 2/3    [== ]
 *  6: Barra de progresso cheia  [===]
 *  7: (reservado)
 *
 * ============================================================================
 */

// ─────────────────────────────────────────────────────────────────────────
//  INCLUDES
// ─────────────────────────────────────────────────────────────────────────
#include <Arduino.h>
#include <SPI.h>
#include <Wire.h>
#include <AccelStepper.h>
#include <LiquidCrystal_I2C.h>
#include <Ds1302.h>
#include <MFRC522.h>
#include <BTstackLib.h>
#include <ble/att_server.h>

// ─────────────────────────────────────────────────────────────────────────
//  PINOS
// ─────────────────────────────────────────────────────────────────────────
#define LED_AZUL      13
#define LED_VERDE     14
#define LED_VERMELHO  15

const int BUZZER = 0;

#define IN1 9
#define IN2 8
#define IN3 7
#define IN4 6

#define ENC_CLK 1
#define ENC_DT  2
#define ENC_SW  3

#define REED_PIN 18

#define PIN_SDA 4
#define PIN_SCL 5

#define RTC_CLK 10
#define RTC_DAT 11
#define RTC_RST 12

#define RC522_SCK  22
#define RC522_MOSI 19
#define RC522_MISO 20
#define RC522_CS   21
#define RC522_RST  28

// ─────────────────────────────────────────────────────────────────────────
//  CONSTANTES
// ─────────────────────────────────────────────────────────────────────────
#define MAX_MEDS            5
#define MAX_INTERVALO_SEG   3600
#define MAX_DURACAO_DIAS    30
#define ATRASO_MS           10000UL
#define STEPS_VOLTA         2048
#define ESPACOS_RODA        9
#define AVISO_RESTOCK       3

// ─────────────────────────────────────────────────────────────────────────
//  OBJETOS
// ─────────────────────────────────────────────────────────────────────────
AccelStepper      stepper(AccelStepper::HALF4WIRE, IN1, IN3, IN2, IN4);
LiquidCrystal_I2C lcd(0x27, 16, 2);
Ds1302            rtc(RTC_RST, RTC_CLK, RTC_DAT);
MFRC522           rfid(RC522_CS, RC522_RST);

// ─────────────────────────────────────────────────────────────────────────
//  CARACTERES CUSTOMIZADOS LCD
// ─────────────────────────────────────────────────────────────────────────

byte charCapsulaEsq[8] = {
    0b01110, 0b11111, 0b11111, 0b11000,
    0b11000, 0b11111, 0b11111, 0b01110
};

byte charCapsulaDir[8] = {
    0b01110, 0b11111, 0b11111, 0b00011,
    0b00011, 0b11111, 0b11111, 0b01110
};

byte charGrafico[8] = {
    0b00000, 0b00001, 0b00011, 0b00110,
    0b01100, 0b11000, 0b10000, 0b00000
};

byte charBarraVazia[8] = {
    0b11111, 0b10001, 0b10001, 0b10001,
    0b10001, 0b10001, 0b10001, 0b11111
};

byte charBarra1[8] = {
    0b11111, 0b10001, 0b11001, 0b11001,
    0b11001, 0b11001, 0b10001, 0b11111
};

byte charBarra2[8] = {
    0b11111, 0b10001, 0b11101, 0b11101,
    0b11101, 0b11101, 0b10001, 0b11111
};

byte charBarraCheia[8] = {
    0b11111, 0b10001, 0b11111, 0b11111,
    0b11111, 0b11111, 0b10001, 0b11111
};

#define CHR_CAPSULA_ESQ  0
#define CHR_CAPSULA_DIR  1
#define CHR_GRAFICO      2
#define CHR_BARRA_VAZIA  3
#define CHR_BARRA_1      4
#define CHR_BARRA_2      5
#define CHR_BARRA_CHEIA  6

// ─────────────────────────────────────────────────────────────────────────
//  TABELA RFID
// ─────────────────────────────────────────────────────────────────────────
struct MedicationCard {
    const char* uid;
    const char* schedule;
    const char* label;
    int         intervaloSegundos;
    int         duracaoDias;
};

static const MedicationCard CARD_TABLE[] = {
    { "A1B2C3D4",       "SYNC|0800|1300|2000", "Pastilha diaria", 30,  30 },
    { "11223344",        "SYNC|0730|1930",       "2x por dia",      60,  14 },
    { "DEADBEEF",        "SYNC|1200",            "Almoco",          90,   7 },
    { "5F4B7FD4C0CC81",  "SYNC|0800|1300|2000", "Comprimido",      10,  30 },
};
static const uint8_t CARD_TABLE_SIZE = sizeof(CARD_TABLE) / sizeof(CARD_TABLE[0]);

// ─────────────────────────────────────────────────────────────────────────
//  ESTRUTURA DE MEDICAMENTO
// ─────────────────────────────────────────────────────────────────────────
struct Medicamento {
    char nome[16];
    int  intervaloSegundos;
    int  duracaoDias;
    bool ativo;
};

Medicamento meds[MAX_MEDS];
int numMeds  = 0;
int medAtual = 0;

// ─────────────────────────────────────────────────────────────────────────
//  ESTATÍSTICAS
// ─────────────────────────────────────────────────────────────────────────
struct Estatisticas {
    uint16_t tomadasPontuais;
    uint16_t tomadasAtrasadas;
    uint16_t ignoradas;
    int      tomasDesdeRestock;
};

Estatisticas stats = { 0, 0, 0, 0 };

// ─────────────────────────────────────────────────────────────────────────
//  MÁQUINA DE ESTADOS
// ─────────────────────────────────────────────────────────────────────────
enum EstadoSistema {
    EST_INICIAL,
    EST_MENU_PRINCIPAL,
    EST_MENU_DADOS,
    EST_MENU_CONFIG,
    EST_CONFIG_MANUAL,
    EST_ESPERA,
    EST_TOMA_ALERTA,
    EST_TOMA_AGUARDA_ABERT,
    EST_TOMA_AGUARDA_FECHO
};

EstadoSistema estadoAtual = EST_INICIAL;

// ─────────────────────────────────────────────────────────────────────────
//  VARIÁVEIS GLOBAIS
// ─────────────────────────────────────────────────────────────────────────
int           lastCLK;
bool          lastButtonState = HIGH;
unsigned long ultimaToma      = 0;
unsigned long inicioAlerta    = 0;
unsigned long inicioAtraso    = 0;
bool          motorAtivo      = false;
bool          gavetaAbriu     = false;

// ─────────────────────────────────────────────────────────────────────────
//  BLE
// ─────────────────────────────────────────────────────────────────────────
static UUID careboxServiceUUID("a1b2c3d4-e5f6-7890-abcd-ef1234567890");
static UUID motorCharUUID     ("a1b2c3d4-e5f6-7890-abcd-ef1234567891");
static UUID eventosCharUUID   ("a1b2c3d4-e5f6-7890-abcd-ef1234567892");
static UUID appConfigCharUUID ("a1b2c3d4-e5f6-7890-abcd-ef1234567893");
static UUID statsCharUUID     ("a1b2c3d4-e5f6-7890-abcd-ef1234567894");
static UUID rfidSyncCharUUID  ("a1b2c3d4-e5f6-7890-abcd-ef1234567895");

static uint16_t         motorHandle      = 0;
static uint16_t         eventosHandle    = 0;
static uint16_t         appConfigHandle  = 0;
static uint16_t         statsHandle      = 0;
static uint16_t         rfidSyncHandle   = 0;
static hci_con_handle_t connectionHandle = HCI_CON_HANDLE_INVALID;

static bool notifyEventos  = false;
static bool notifyRfidSync = false;

static volatile int32_t pendingSteps = 0;
static volatile bool    newBleMotor  = false;
static volatile bool    novaMedBLE   = false;

static char lastEventoPayload[64]    = "";
static char lastStatsPayload[80]     = "";
static char lastRfidSyncPayload[128] = "";

// ═════════════════════════════════════════════════════════════════════════
//  INICIALIZAR CARACTERES CUSTOMIZADOS LCD
// ═════════════════════════════════════════════════════════════════════════
void inicializarCharsLCD() {
    lcd.createChar(CHR_CAPSULA_ESQ, charCapsulaEsq);
    lcd.createChar(CHR_CAPSULA_DIR, charCapsulaDir);
    lcd.createChar(CHR_GRAFICO,     charGrafico);
    lcd.createChar(CHR_BARRA_VAZIA, charBarraVazia);
    lcd.createChar(CHR_BARRA_1,     charBarra1);
    lcd.createChar(CHR_BARRA_2,     charBarra2);
    lcd.createChar(CHR_BARRA_CHEIA, charBarraCheia);
}

// ═════════════════════════════════════════════════════════════════════════
//  LOGO CARESYNC NO LCD
// ═════════════════════════════════════════════════════════════════════════
void mostrarLogoLCD() {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.write(CHR_CAPSULA_ESQ);
    lcd.write(CHR_CAPSULA_DIR);
    lcd.print(" CareBox ");
    lcd.write(CHR_GRAFICO);
    lcd.print("  ");
    lcd.setCursor(0, 1);
    lcd.print("- Projeto Final -");
}

// ═════════════════════════════════════════════════════════════════════════
//  BARRA DE PROGRESSO LCD
// ═════════════════════════════════════════════════════════════════════════
void mostrarBarraProgresso(int linha, int colInicio, int largura, int progresso) {
    int totalPassos  = largura * 3;
    int passosAtivos = (progresso * totalPassos) / 100;

    lcd.setCursor(colInicio, linha);
    for (int i = 0; i < largura; i++) {
        int passosNestaPos = passosAtivos - (i * 3);
        if      (passosNestaPos >= 3) lcd.write(CHR_BARRA_CHEIA);
        else if (passosNestaPos == 2) lcd.write(CHR_BARRA_2);
        else if (passosNestaPos == 1) lcd.write(CHR_BARRA_1);
        else                          lcd.write(CHR_BARRA_VAZIA);
    }
}

// ═════════════════════════════════════════════════════════════════════════
//  LED BREATH
// ═════════════════════════════════════════════════════════════════════════
void ledBreath(int r, int g, int b, unsigned long t, unsigned long periodo) {
    float fase = (float)(t % periodo) / (float)periodo;
    float intensidade = sin(fase * 3.14159265f);
    intensidade = 0.05f + intensidade * 0.95f;
    analogWrite(LED_VERMELHO, (int)(r * intensidade));
    analogWrite(LED_VERDE,    (int)(g * intensidade));
    analogWrite(LED_AZUL,     (int)(b * intensidade));
}

void ledBreathAzul() { ledBreath(0, 0, 255, millis(), 3000UL); }
void ledBreathVerde() { ledBreath(0, 255, 0, millis(), 2000UL); }

// ═════════════════════════════════════════════════════════════════════════
//  RGB — cores estáticas
// ═════════════════════════════════════════════════════════════════════════
void cor(int r, int g, int b) {
    analogWrite(LED_VERMELHO, r);
    analogWrite(LED_VERDE,    g);
    analogWrite(LED_AZUL,     b);
}
void ledVermelho()  { cor(255, 0,   0);   }
void ledAmarelo()   { cor(255, 200, 0);   }
void ledDesligado() { cor(0,   0,   0);   }

// ═════════════════════════════════════════════════════════════════════════
//  BUZZER
// ═════════════════════════════════════════════════════════════════════════
void apitarSimples() {
    tone(BUZZER, 1000); delay(200); noTone(BUZZER); delay(100);
    tone(BUZZER, 1000); delay(200); noTone(BUZZER);
}

void apitarAlerta() {
    for (int r = 0; r < 3; r++) {
        for (int f = 800;  f <= 1400; f += 30) { tone(BUZZER, f); delay(8); }
        for (int f = 1400; f >= 800;  f -= 30) { tone(BUZZER, f); delay(8); }
        noTone(BUZZER); delay(80);
    }
}

// ═════════════════════════════════════════════════════════════════════════
//  LCD — mensagens
// ═════════════════════════════════════════════════════════════════════════
void lcdMsg(const char* l0, const char* l1 = "") {
    lcd.clear();
    lcd.setCursor(0, 0); lcd.print(l0);
    lcd.setCursor(0, 1); lcd.print(l1);
}

void lcdMsgComBarra(const char* l0, unsigned long duracaoMs) {
    lcd.clear();
    lcd.setCursor(0, 0); lcd.print(l0);
    unsigned long inicio = millis();
    while (millis() - inicio < duracaoMs) {
        int progresso = (int)(((millis() - inicio) * 100UL) / duracaoMs);
        if (progresso > 100) progresso = 100;
        mostrarBarraProgresso(1, 0, 16, progresso);
        if (motorAtivo && !stepper.run()) { stepper.disableOutputs(); motorAtivo = false; }
        delay(50);
    }
}

// ═════════════════════════════════════════════════════════════════════════
//  ENCODER + BOTÃO
// ═════════════════════════════════════════════════════════════════════════
bool botaoPressionado() {
    static unsigned long ultimoPressao = 0;
    bool estado = digitalRead(ENC_SW);
    if (estado == LOW && lastButtonState == HIGH) {
        if (millis() - ultimoPressao > 200) {
            ultimoPressao   = millis();
            lastButtonState = estado;
            return true;
        }
    }
    lastButtonState = estado;
    return false;
}

int lerEncoder() {
    int currentCLK = digitalRead(ENC_CLK);
    int delta = 0;
    if (currentCLK != lastCLK && currentCLK == HIGH)
        delta = (digitalRead(ENC_DT) != currentCLK) ? 1 : -1;
    lastCLK = currentCLK;
    return delta;
}

// ═════════════════════════════════════════════════════════════════════════
//  UI HELPERS
// ═════════════════════════════════════════════════════════════════════════
int escolherOpcao(const char* titulo, const char* op0, const char* op1) {
    int sel = 0;
    lcd.clear();
    while (true) {
        if (motorAtivo && !stepper.run()) { stepper.disableOutputs(); motorAtivo = false; }
        lcd.setCursor(0, 0); lcd.print(titulo);
        lcd.setCursor(0, 1);
        if (sel == 0) { lcd.print(">"); lcd.print(op0); lcd.print(" "); lcd.print(op1); }
        else          { lcd.print(" "); lcd.print(op0); lcd.print(">"); lcd.print(op1); }
        lcd.print("     ");
        int d = lerEncoder();
        if (d != 0) { sel = (sel == 0) ? 1 : 0; delay(5); }
        if (botaoPressionado()) return sel;
        if (novaMedBLE) { novaMedBLE = false; return -1; }
        delay(5);
    }
}

int ajustarNumero(const char* linha0, int valorInicial, int minVal, int maxVal, const char* unidade) {
    int val = valorInicial;
    lcd.clear();
    while (true) {
        if (motorAtivo && !stepper.run()) { stepper.disableOutputs(); motorAtivo = false; }
        lcd.setCursor(0, 0); lcd.print(linha0);
        lcd.setCursor(0, 1);
        lcd.print(val); lcd.print(" "); lcd.print(unidade); lcd.print("           ");
        int d = lerEncoder();
        if (d != 0) {
            val += d;
            if (val < minVal) val = maxVal;
            if (val > maxVal) val = minVal;
        }
        if (botaoPressionado()) return val;
        delay(5);
    }
}

// ═════════════════════════════════════════════════════════════════════════
//  MOTOR
// ═════════════════════════════════════════════════════════════════════════
void iniciarDispensa(int passos) {
    stepper.enableOutputs();
    stepper.move(passos);
    motorAtivo = true;
}

void desligarMotor() {
    digitalWrite(IN1, LOW); digitalWrite(IN2, LOW);
    digitalWrite(IN3, LOW); digitalWrite(IN4, LOW);
    motorAtivo = false;
}

// ═════════════════════════════════════════════════════════════════════════
//  BLE — STATS
// ═════════════════════════════════════════════════════════════════════════
void atualizarStatsPayload() {
    int stockRestante = ESPACOS_RODA - stats.tomasDesdeRestock;
    if (stockRestante < 0) stockRestante = 0;
    snprintf(lastStatsPayload, sizeof(lastStatsPayload),
        "STATS|%d|%d|%d|%d",
        stats.tomadasPontuais, stats.tomadasAtrasadas,
        stats.ignoradas, stockRestante);
}

// ═════════════════════════════════════════════════════════════════════════
//  BLE — ENVIAR EVENTO
// ═════════════════════════════════════════════════════════════════════════
void enviarEvento(const char* payload) {
    strncpy(lastEventoPayload, payload, sizeof(lastEventoPayload) - 1);
    lastEventoPayload[sizeof(lastEventoPayload) - 1] = '\0';
    Serial.print(F("[BLE] Evento: ")); Serial.println(lastEventoPayload);
    if (connectionHandle != HCI_CON_HANDLE_INVALID && notifyEventos) {
        int r = att_server_notify(connectionHandle, eventosHandle,
            reinterpret_cast<uint8_t*>(lastEventoPayload), strlen(lastEventoPayload));
        Serial.println(r == 0 ? F("[BLE] Evento OK") : F("[BLE] Evento FALHOU"));
    }
}

// ═════════════════════════════════════════════════════════════════════════
//  BLE — ENVIAR RFID SYNC
// ═════════════════════════════════════════════════════════════════════════
void enviarRfidSync(const char* payload) {
    strncpy(lastRfidSyncPayload, payload, sizeof(lastRfidSyncPayload) - 1);
    lastRfidSyncPayload[sizeof(lastRfidSyncPayload) - 1] = '\0';
    Serial.print(F("[BLE] RfidSync: ")); Serial.println(lastRfidSyncPayload);
    if (connectionHandle != HCI_CON_HANDLE_INVALID && notifyRfidSync) {
        int r = att_server_notify(connectionHandle, rfidSyncHandle,
            reinterpret_cast<uint8_t*>(lastRfidSyncPayload), strlen(lastRfidSyncPayload));
        Serial.println(r == 0 ? F("[BLE] RfidSync OK") : F("[BLE] RfidSync FALHOU"));
    }
}

void enviarHorarioAtual(const char* schedule) {
    Ds1302::DateTime now;
    rtc.getDateTime(&now);
    char payload[128];
    snprintf(payload, sizeof(payload), "SYNC|%02d%02d", now.hour, now.minute);
    char temp[64];
    strncpy(temp, schedule, sizeof(temp) - 1);
    temp[sizeof(temp) - 1] = '\0';
    char* token = strtok(temp, "|");
    token = strtok(NULL, "|");
    while (token != NULL) {
        char hora[8];
        snprintf(hora, sizeof(hora), "|%s", token);
        strncat(payload, hora, sizeof(payload) - strlen(payload) - 1);
        token = strtok(NULL, "|");
    }
    enviarRfidSync(payload);
}

// ═════════════════════════════════════════════════════════════════════════
//  RESTOCK
// ═════════════════════════════════════════════════════════════════════════
void verificarRestock() {
    int restantes = ESPACOS_RODA - stats.tomasDesdeRestock;
    if (restantes > AVISO_RESTOCK || restantes <= 0) return;
    char buf0[17], buf1[17];
    snprintf(buf0, sizeof(buf0), "!! RESTOCK !!");
    snprintf(buf1, sizeof(buf1), "Restam %d tomas", restantes);
    lcdMsg(buf0, buf1);
    delay(2000);
    lcd.clear();
    static unsigned long ultimoAvisoRestock = 0;
    if (millis() - ultimoAvisoRestock > 60000UL) {
        char payload[32];
        snprintf(payload, sizeof(payload), "RESTOCK|%d", restantes);
        enviarEvento(payload);
        ultimoAvisoRestock = millis();
    }
}

// ═════════════════════════════════════════════════════════════════════════
//  RFID
// ═════════════════════════════════════════════════════════════════════════
static void uidParaHex(byte* uid, byte len, char* out, size_t sz) {
    out[0] = '\0';
    for (byte i = 0; i < len && (i * 2 + 2) < sz; i++)
        snprintf(out + i * 2, sz - i * 2, "%02X", uid[i]);
}

static const MedicationCard* procurarCartao(const char* uidHex) {
    for (uint8_t i = 0; i < CARD_TABLE_SIZE; i++)
        if (strcmp(CARD_TABLE[i].uid, uidHex) == 0) return &CARD_TABLE[i];
    return nullptr;
}

static void carregarHorarioCartao(const MedicationCard* card) {
    numMeds  = 1; medAtual = 0;
    memset(meds, 0, sizeof(meds));
    meds[0].intervaloSegundos = card->intervaloSegundos;
    meds[0].duracaoDias       = card->duracaoDias;
    strncpy(meds[0].nome, card->label, 15);
    meds[0].ativo = true;
    ultimaToma    = millis();
    estadoAtual   = EST_ESPERA;
    enviarHorarioAtual(card->schedule);
    lcdMsgComBarra("Dados carregados!", 5000);
    lcd.clear();
    Serial.print(F("[RFID] Carregado: ")); Serial.println(card->label);
}

static void verificarRFID() {
    if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;
    char uidHex[15] = "";
    uidParaHex(rfid.uid.uidByte, rfid.uid.size, uidHex, sizeof(uidHex));
    Serial.print(F("[RFID] Card: ")); Serial.println(uidHex);
    const MedicationCard* card = procurarCartao(uidHex);
    if (card) {
        Serial.print(F("[RFID] Conhecido: ")); Serial.println(card->label);
        carregarHorarioCartao(card);
    } else {
        char payload[64];
        snprintf(payload, sizeof(payload), "RFID|UNKNOWN|%s", uidHex);
        enviarRfidSync(payload);
        lcdMsg("Pulseira", "desconhecida!");
        delay(2000); lcd.clear();
        Serial.println(F("[RFID] Desconhecida"));
    }
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
}

// ═════════════════════════════════════════════════════════════════════════
//  BLE CALLBACKS
// ═════════════════════════════════════════════════════════════════════════
void bleConnected(BLEStatus status, BLEDevice* device) {
    if (status == BLE_STATUS_OK) {
        connectionHandle = device->getHandle();
        Serial.print(F("[BLE] Ligado. Handle: 0x"));
        Serial.println(connectionHandle, HEX);
        atualizarStatsPayload();
    }
}

void bleDisconnected(BLEDevice*) {
    connectionHandle = HCI_CON_HANDLE_INVALID;
    notifyEventos    = false;
    notifyRfidSync   = false;
    Serial.println(F("[BLE] Desligado."));
}

// ─────────────────────────────────────────────────────────────────────────
//  GATT READ
// ─────────────────────────────────────────────────────────────────────────
uint16_t gattRead(uint16_t handle, uint8_t* buf, uint16_t sz) {
    if (handle == motorHandle) {
        if (buf) { int32_t v = pendingSteps; uint16_t len = min((uint16_t)sizeof(v), sz); memcpy(buf, &v, len); return len; }
        return sizeof(int32_t);
    }
    if (handle == eventosHandle) {
        if (buf) { uint16_t len = min((uint16_t)strlen(lastEventoPayload), sz); memcpy(buf, lastEventoPayload, len); return len; }
        return strlen(lastEventoPayload);
    }
    if (handle == statsHandle) {
        atualizarStatsPayload();
        if (buf) { uint16_t len = min((uint16_t)strlen(lastStatsPayload), sz); memcpy(buf, lastStatsPayload, len); return len; }
        return strlen(lastStatsPayload);
    }
    if (handle == rfidSyncHandle) {
        if (buf) { uint16_t len = min((uint16_t)strlen(lastRfidSyncPayload), sz); memcpy(buf, lastRfidSyncPayload, len); return len; }
        return strlen(lastRfidSyncPayload);
    }
    return 0;
}

// ─────────────────────────────────────────────────────────────────────────
//  GATT WRITE
// ─────────────────────────────────────────────────────────────────────────
int gattWrite(uint16_t handle, uint8_t* buf, uint16_t sz) {
    if (handle == eventosHandle + 1 && sz == 2) {
        notifyEventos = (((buf[1] << 8) | buf[0]) == 0x0001);
        Serial.print(F("[BLE] Eventos notify ")); Serial.println(notifyEventos ? F("ON") : F("OFF"));
        return 0;
    }
    if (handle == rfidSyncHandle + 1 && sz == 2) {
        notifyRfidSync = (((buf[1] << 8) | buf[0]) == 0x0001);
        Serial.print(F("[BLE] RfidSync notify ")); Serial.println(notifyRfidSync ? F("ON") : F("OFF"));
        return 0;
    }
    if (handle == motorHandle && sz == sizeof(int32_t)) {
        int32_t steps;
        memcpy(&steps, buf, sizeof(steps));
        if (steps != 0 && abs(steps) <= 10L * STEPS_VOLTA) { pendingSteps = steps; newBleMotor = true; }
        return 0;
    }
    if (handle == appConfigHandle && sz > 0 && sz < 64) {
        char payload[64];
        memcpy(payload, buf, sz);
        payload[sz] = '\0';
        Serial.print(F("[BLE] AppConfig: ")); Serial.println(payload);

        if (strcmp(payload, "RESET") == 0) {
            numMeds = 0; medAtual = 0; ultimaToma = 0;
            memset(meds, 0, sizeof(meds)); memset(&stats, 0, sizeof(stats));
            novaMedBLE = false; atualizarStatsPayload();
            lcdMsg("CareBox reset", "feito!"); delay(800); lcd.clear();
            estadoAtual = EST_INICIAL;
            mostrarLogoLCD();
            return 0;
        }
        if (strcmp(payload, "RESTOCK_RESET") == 0) {
            stats.tomasDesdeRestock = 0; atualizarStatsPayload();
            lcdMsg("Roda recarregada", "Stock OK!"); delay(1500); lcd.clear();
            return 0;
        }
        if (strncmp(payload, "MED|", 4) == 0 && numMeds < MAX_MEDS) {
            char tmp[64];
            strncpy(tmp, payload + 4, sizeof(tmp) - 1); tmp[sizeof(tmp) - 1] = '\0';
            char* tok = strtok(tmp, "|");
            if (tok) { strncpy(meds[numMeds].nome, tok, 15); meds[numMeds].nome[15] = '\0'; }
            else     { snprintf(meds[numMeds].nome, 16, "Med %d", numMeds + 1); }
            tok = strtok(nullptr, "|");
            meds[numMeds].intervaloSegundos = tok ? max(1, atoi(tok)) : 60;
            tok = strtok(nullptr, "|");
            meds[numMeds].duracaoDias = tok ? max(1, atoi(tok)) : 7;
            meds[numMeds].ativo = true;
            numMeds++;
            Serial.printf("[BLE] Med %d: %s | %ds | %ddias\n", numMeds,
                meds[numMeds-1].nome, meds[numMeds-1].intervaloSegundos, meds[numMeds-1].duracaoDias);
            if (numMeds == 1) { medAtual = 0; ultimaToma = millis(); estadoAtual = EST_ESPERA; novaMedBLE = true; }
            char l0[17], l1[17];
            snprintf(l0, sizeof(l0), "App:%-12s", meds[numMeds-1].nome);
            snprintf(l1, sizeof(l1), "%ds / %dd", meds[numMeds-1].intervaloSegundos, meds[numMeds-1].duracaoDias);
            lcdMsg(l0, l1);
        } else if (numMeds >= MAX_MEDS) {
            lcdMsg("Max. medicam.", "atingido!");
        }
        return 0;
    }
    return 0;
}

// ═════════════════════════════════════════════════════════════════════════
//  CONFIGURAÇÃO MANUAL
// ═════════════════════════════════════════════════════════════════════════
void configuracaoManual() {
    numMeds = 0;
    memset(meds, 0, sizeof(meds));

    while (numMeds < MAX_MEDS) {
        char t[17];
        sprintf(t, "Med%d Intervalo:", numMeds + 1);
        int intervalo = ajustarNumero(t, 10, 1, MAX_INTERVALO_SEG, "segundos");
        sprintf(t, "Med%d Duracao:", numMeds + 1);
        int duracao = ajustarNumero(t, 7, 1, MAX_DURACAO_DIAS, "dias");
        char nomeAuto[16];
        sprintf(nomeAuto, "Medicamento %d", numMeds + 1);
        char conf[17];
        sprintf(conf, "%ds/%dd", intervalo, duracao);
        int ok = escolherOpcao(conf, "Conf", "Cancel");
        if (ok == -1) { estadoAtual = EST_ESPERA; return; }
        if (ok == 0) {
            meds[numMeds].intervaloSegundos = intervalo;
            meds[numMeds].duracaoDias       = duracao;
            strncpy(meds[numMeds].nome, nomeAuto, 15);
            meds[numMeds].ativo = true;
            numMeds++;
            if (numMeds < MAX_MEDS) {
                int mais = escolherOpcao("Mais med.?", "Sim", "Nao");
                if (mais == 1 || mais == -1) break;
            } else { lcdMsg("Max. medicam.", "atingido!"); delay(1500); break; }
        } else { lcdMsg("Cancelado.", "Recomecar..."); delay(1000); }
    }

    if (numMeds == 0) { lcdMsg("Nenhum med.", "configurado."); delay(1500); estadoAtual = EST_INICIAL; return; }
    lcdMsgComBarra("Config. guardada", 1500);
    ultimaToma = millis(); medAtual = 0;
    estadoAtual = EST_ESPERA;
}

// ═════════════════════════════════════════════════════════════════════════
//  ESTADOS DO LOOP
// ═════════════════════════════════════════════════════════════════════════

void estadoEspera() {
    if (numMeds == 0) { estadoAtual = EST_INICIAL; return; }
    verificarRFID();
    verificarRestock();
    Medicamento& m      = meds[medAtual % numMeds];
    unsigned long intMs = (unsigned long)m.intervaloSegundos * 1000UL;
    unsigned long pass  = millis() - ultimaToma;
    if (pass >= intMs) { estadoAtual = EST_TOMA_ALERTA; return; }
    unsigned long restante = intMs - pass;
    unsigned long segundos = restante / 1000UL;
    char buf0[17], buf1[17];
    snprintf(buf0, sizeof(buf0), "%-16s", m.nome);
    snprintf(buf1, sizeof(buf1), "%02lus restam    ", segundos);
    lcd.setCursor(0, 0); lcd.print(buf0);
    lcd.setCursor(0, 1); lcd.print(buf1);
    ledBreathAzul();
    if (botaoPressionado()) { estadoAtual = EST_MENU_PRINCIPAL; ledDesligado(); lcd.clear(); }
}

void estadoTomaAlerta() {
    ledVermelho();
    apitarAlerta();
    iniciarDispensa(STEPS_VOLTA / 5);
    inicioAlerta = millis();
    inicioAtraso = millis();
    gavetaAbriu  = false;
    lcdMsg("Hora da med.!", meds[medAtual % numMeds].nome);
    estadoAtual = EST_TOMA_AGUARDA_ABERT;
}

void estadoAguardaAbertura() {
    if (motorAtivo && !stepper.run()) { stepper.disableOutputs(); motorAtivo = false; }
    ledVermelho();
    if (digitalRead(REED_PIN) == LOW) {
        gavetaAbriu = true;
        ledAmarelo();
        lcdMsg("Tomar medic.", "e feche a gaveta");
        estadoAtual = EST_TOMA_AGUARDA_FECHO;
        return;
    }
    if (millis() - inicioAtraso >= ATRASO_MS) {
        lcdMsg("Medicacao", "atrasada!");
        apitarAlerta();
        inicioAtraso = millis();
    }
}

void estadoAguardaFecho() {
    if (digitalRead(REED_PIN) == HIGH) {
        unsigned long atrasoSeg = (millis() - inicioAlerta) / 1000UL;
        char eventoPayload[64];
        if (atrasoSeg < 5) {
            stats.tomadasPontuais++;
            snprintf(eventoPayload, sizeof(eventoPayload),
                "MED_TOMADA|%s|pontual", meds[medAtual % numMeds].nome);
        } else {
            stats.tomadasAtrasadas++;
            snprintf(eventoPayload, sizeof(eventoPayload),
                "MED_TOMADA|%s|atraso|%lus", meds[medAtual % numMeds].nome, atrasoSeg);
        }
        stats.tomasDesdeRestock++;
        atualizarStatsPayload();
        enviarEvento(eventoPayload);
        lcdMsgComBarra("Medicacao tomada", 2000);
        ledBreathVerde();
        apitarSimples();
        delay(500);
        ledDesligado();
        ultimaToma  = millis();
        medAtual++;
        estadoAtual = EST_ESPERA;
        lcd.clear();
    }
    if (!gavetaAbriu && millis() - inicioAlerta > 300000UL) {
        stats.ignoradas++;
        atualizarStatsPayload();
        char payload[48];
        snprintf(payload, sizeof(payload), "MED_IGNORADA|%s", meds[medAtual % numMeds].nome);
        enviarEvento(payload);
        ultimaToma  = millis();
        medAtual++;
        estadoAtual = EST_ESPERA;
        lcd.clear();
        Serial.println(F("[STATS] Toma ignorada (timeout 5min)"));
    }
}

// ── MENUS ─────────────────────────────────────────────────────────────────
void menuDados() {
    int op = escolherOpcao("Dados:", "Carregar", "Descarreg");
    if (op == -1) { estadoAtual = EST_ESPERA; return; }
    if (op == 0) {
        lcdMsgComBarra("A resetar...", 1000);
        numMeds = 0; medAtual = 0; ultimaToma = 0;
        memset(meds, 0, sizeof(meds)); memset(&stats, 0, sizeof(stats));
        atualizarStatsPayload();
        lcdMsg("Reset feito!", ""); delay(800);
    } else {
        lcdMsg("Esperar dados", "da CareApp..."); delay(5000);
    }
    estadoAtual = EST_MENU_PRINCIPAL;
}

void menuConfig() {
    int op = escolherOpcao("Config:", "Manual", "CareBand");
    if (op == -1) { estadoAtual = EST_ESPERA; return; }
    if (op == 0) {
        estadoAtual = EST_CONFIG_MANUAL;
    } else {
        lcdMsg("Aprox. CareBand", "ao leitor RFID");
        unsigned long t0 = millis();
        while (millis() - t0 < 15000UL) {
            verificarRFID();
            if (estadoAtual == EST_ESPERA) return;
            delay(100);
        }
        lcdMsg("Timeout!", "Sem leitura."); delay(1500);
        estadoAtual = EST_MENU_PRINCIPAL;
    }
}

void menuPrincipal() {
    int op = escolherOpcao("Menu:", "Dados", "Config");
    if (op == -1) { estadoAtual = EST_ESPERA; return; }
    estadoAtual = (op == 0) ? EST_MENU_DADOS : EST_MENU_CONFIG;
}

// ═════════════════════════════════════════════════════════════════════════
//  SETUP
// ═════════════════════════════════════════════════════════════════════════
void setup() {
    Serial.begin(115200);
    delay(500);
    Serial.println(F("=== CareSync Firmware ==="));

    // Pinos
    pinMode(LED_VERMELHO, OUTPUT);
    pinMode(LED_VERDE,    OUTPUT);
    pinMode(LED_AZUL,     OUTPUT);
    pinMode(BUZZER,       OUTPUT);
    pinMode(ENC_CLK,      INPUT);
    pinMode(ENC_DT,       INPUT);
    pinMode(ENC_SW,       INPUT_PULLUP);
    pinMode(REED_PIN,     INPUT_PULLUP);

    // Motor
    stepper.setMaxSpeed(800);
    stepper.setAcceleration(400);

    // LCD
    Wire.setSDA(PIN_SDA);
    Wire.setSCL(PIN_SCL);
    Wire.begin();
    lcd.init();
    lcd.backlight();
    inicializarCharsLCD();
    mostrarLogoLCD();

    // RTC
    Ds1302::DateTime dt = { .year = 25, .month = 6, .day = 1,
                            .hour = 12, .minute = 0, .second = 0,
                            .dow  = Ds1302::DOW_SUN };
    rtc.setDateTime(&dt);

    // RFID
    SPI1.setRX(RC522_MISO);
    SPI1.setTX(RC522_MOSI);
    SPI1.setSCK(RC522_SCK);
    SPI1.begin();
    rfid.PCD_Init();
    Serial.println(rfid.PCD_DumpVersionToSerial() ? F("[RFID] OK") : F("[RFID] ?"));

    // BLE
    BTstack.setBLEDeviceConnectedCallback(bleConnected);
    BTstack.setBLEDeviceDisconnectedCallback(bleDisconnected);
    BTstack.setGATTCharacteristicRead(gattRead);
    BTstack.setGATTCharacteristicWrite(gattWrite);

    BTstack.addGATTService(new UUID(careboxServiceUUID));
    motorHandle     = BTstack.addGATTCharacteristicDynamic(new UUID(motorCharUUID),     ATT_PROPERTY_READ | ATT_PROPERTY_WRITE, 0);
    eventosHandle   = BTstack.addGATTCharacteristicDynamic(new UUID(eventosCharUUID),   ATT_PROPERTY_READ | ATT_PROPERTY_NOTIFY, 0);
    appConfigHandle = BTstack.addGATTCharacteristicDynamic(new UUID(appConfigCharUUID), ATT_PROPERTY_WRITE, 0);
    statsHandle     = BTstack.addGATTCharacteristicDynamic(new UUID(statsCharUUID),     ATT_PROPERTY_READ, 0);
    rfidSyncHandle  = BTstack.addGATTCharacteristicDynamic(new UUID(rfidSyncCharUUID),  ATT_PROPERTY_READ | ATT_PROPERTY_NOTIFY, 0);

    BTstack.setup("CareBox");
    BTstack.startAdvertising();
    Serial.println(F("[BLE] Advertising..."));

    lastCLK = digitalRead(ENC_CLK);
    ledDesligado();
    estadoAtual = EST_INICIAL;
    Serial.println(F("=== Setup completo ==="));
}

// ═════════════════════════════════════════════════════════════════════════
//  LOOP
// ═════════════════════════════════════════════════════════════════════════
void loop() {
    BTstack.loop();

    if (motorAtivo && !stepper.run()) {
        stepper.disableOutputs();
        motorAtivo = false;
    }

    if (newBleMotor) {
        newBleMotor = false;
        iniciarDispensa(pendingSteps);
        char l0[17];
        snprintf(l0, sizeof(l0), "BLE Motor:%ld", (long)pendingSteps);
        lcdMsg(l0, "A rodar...");
    }

    switch (estadoAtual) {
        case EST_INICIAL:
            verificarRFID();
            if (botaoPressionado()) { estadoAtual = EST_MENU_PRINCIPAL; lcd.clear(); }
            break;
        case EST_MENU_PRINCIPAL:    menuPrincipal();          break;
        case EST_MENU_DADOS:        menuDados();              break;
        case EST_MENU_CONFIG:       menuConfig();             break;
        case EST_CONFIG_MANUAL:     configuracaoManual();     break;
        case EST_ESPERA:            estadoEspera();           break;
        case EST_TOMA_ALERTA:       estadoTomaAlerta();       break;
        case EST_TOMA_AGUARDA_ABERT: estadoAguardaAbertura(); break;
        case EST_TOMA_AGUARDA_FECHO: estadoAguardaFecho();    break;
    }

    delay(5);
}
