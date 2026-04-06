import { Link, useRouter } from "expo-router";
import { Lock, Mail, User } from "@/constants/lucideIcons";
import {
  buildE164,
  getDefaultPhoneCountry,
  type PhoneCountry,
} from "@/constants/phoneCountries";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  AuthBackground,
  AuthBirthDateField,
  AuthBranding,
  AuthCard,
  AuthHelpButton,
  AuthPasswordStrength,
  AuthPhoneField,
  AuthPrimaryButton,
  AuthTextField,
  PasswordVisibilityToggle,
} from "@/components/auth";
import { PrismColors } from "@/constants/theme";
import { Layout, Spacing, TextStyles } from "@/constants/uiStyles";
import {
  isValidBirthdate,
  isValidPhoneE164,
  signUpWithProfile,
} from "@/lib/auth/cognito";
import { getPostAuthDestination } from "@/lib/auth/postAuthDestination";
import { syncInternalUserFromSession } from "@/src/services/api/users/usersService";
import {
  passwordMeetsCognitoLikePolicy,
  passwordMissingPartsSpanish,
} from "@/lib/auth/passwordPolicy";

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [name, setName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [phoneCountry, setPhoneCountry] = useState<PhoneCountry>(() =>
    getDefaultPhoneCountry(),
  );
  const [phoneNational, setPhoneNational] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const horizontalPadding = useMemo(
    () => Math.min(24, Math.max(16, width * 0.05)),
    [width],
  );

  const brandingHeaderStyle = useMemo(
    () => ({
      paddingTop: Math.max(insets.top, 4),
      paddingBottom: Spacing.sm,
      paddingHorizontal: horizontalPadding,
    }),
    [insets.top, horizontalPadding],
  );

  const scrollContentStyle = useMemo(
    () => [
      styles.scrollContent,
      {
        flexGrow: 1,
        paddingBottom: insets.bottom + 10,
        paddingHorizontal: horizontalPadding,
      },
    ],
    [insets.bottom, horizontalPadding],
  );

  const phoneE164 = useMemo(
    () => buildE164(phoneCountry, phoneNational),
    [phoneCountry, phoneNational],
  );

  function validateForm(): boolean {
    if (!name.trim() || !middleName.trim() || !email.trim() || !password) {
      Alert.alert(
        "Datos incompletos",
        "Completá nombre, nombre intermedio, correo y contraseña.",
      );
      return false;
    }
    if (!birthdate.trim()) {
      Alert.alert("Fecha de nacimiento", "Ingresá tu fecha de nacimiento.");
      return false;
    }
    if (!isValidBirthdate(birthdate.trim())) {
      Alert.alert(
        "Fecha de nacimiento",
        "Elegí una fecha válida usando el calendario (no podés ser futuro).",
      );
      return false;
    }
    if (!phoneNational.trim()) {
      Alert.alert(
        "Teléfono",
        "Ingresá tu número (sin el código de país; ya está en la bandera).",
      );
      return false;
    }
    if (!isValidPhoneE164(phoneE164)) {
      Alert.alert(
        "Teléfono",
        "Completá un número válido para el país elegido (formato internacional E.164).",
      );
      return false;
    }
    if (!passwordMeetsCognitoLikePolicy(password)) {
      Alert.alert(
        "Contraseña",
        `Tu contraseña debe cumplir lo que pide Cognito. Falta: ${passwordMissingPartsSpanish(password)}.`,
      );
      return false;
    }
    if (!termsAccepted) {
      Alert.alert(
        "Términos",
        "Debés aceptar los términos y la política de privacidad.",
      );
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    if (!validateForm()) return;
    setLoading(true);
    const result = await signUpWithProfile({
      email: email.trim(),
      password,
      name: name.trim(),
      middle_name: middleName.trim(),
      birthdate: birthdate.trim(),
      phone_number: phoneE164,
    });
    setLoading(false);
    if (!result.ok) {
      Alert.alert("Registro", result.message);
      return;
    }
    if (result.data.nextStep === "CONFIRM_SIGN_UP") {
      Alert.alert(
        "Revisá tu correo",
        "Te enviamos un código para confirmar la cuenta.\n\n" +
          "Si no llega en unos minutos: mirá spam y promociones; el remitente suele ser de Amazon/Cognito.\n\n" +
          "En la siguiente pantalla podés usar «Reenviar código». Si en AWS configuraste Amazon SES en modo sandbox, el correo solo se entrega a direcciones verificadas en SES (o tenés que salir del sandbox).",
        [
          {
            text: "Continuar",
            onPress: () =>
              router.replace({
                pathname: "/confirm-signup",
                params: { email: email.trim() },
              }),
          },
        ],
      );
      return;
    }
    if (result.data.nextStep === "COMPLETE_AUTO_SIGN_IN") {
      try {
        await syncInternalUserFromSession();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error al sincronizar";
        Alert.alert(
          "No se pudo guardar tu perfil",
          `${msg}\n\nReintentá desde iniciar sesión.`,
          [{ text: "OK" }],
        );
        return;
      }
      try {
        const href = await getPostAuthDestination({ skipSync: true });
        router.replace(href);
      } catch {
        router.replace("/(onboarding)/link-bank");
      }
      return;
    }
    if (result.data.nextStep === "DONE") {
      Alert.alert("Listo", "Tu cuenta fue creada.", [
        {
          text: "OK",
          onPress: async () => {
            try {
              await syncInternalUserFromSession();
              try {
                const href = await getPostAuthDestination({ skipSync: true });
                router.replace(href);
              } catch {
                router.replace("/(onboarding)/link-bank");
              }
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Error al sincronizar";
              Alert.alert(
                "Perfil no sincronizado",
                `${msg}\n\nPodés continuar e iniciar sesión cuando quieras.`,
                [
                  {
                    text: "Ir a login",
                    onPress: () => router.replace("/login"),
                  },
                  {
                    text: "Continuar",
                    onPress: () => router.replace("/(onboarding)/link-bank"),
                  },
                ],
              );
            }
          },
        },
      ]);
    }
  }

  return (
    <AuthBackground>
      <SafeAreaView style={Layout.flex1} edges={["left", "right"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={Layout.flex1}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <View style={Layout.flex1}>
            <View style={brandingHeaderStyle}>
              <AuthBranding />
            </View>

            <ScrollView
              style={Layout.flex1}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={scrollContentStyle}
              showsVerticalScrollIndicator={false}
            >
              <AuthCard>
                <View style={styles.sectionHeader}>
                  <Text style={TextStyles.screenTitle}>Crear cuenta</Text>
                  <Text
                    style={[TextStyles.caption, styles.subtitle]}
                    numberOfLines={3}
                  >
                    Los datos deben coincidir con los atributos requeridos de tu
                    cuenta en Cognito.
                  </Text>
                </View>

                <View style={Layout.formColumn}>
                  <AuthTextField
                    label="Nombre"
                    placeholder="Nombre"
                    value={name}
                    onChangeText={setName}
                    icon={User}
                    autoCapitalize="words"
                  />
                  <AuthTextField
                    label="Nombre intermedio"
                    placeholder="Segundo nombre o apellido"
                    value={middleName}
                    onChangeText={setMiddleName}
                    icon={User}
                    autoCapitalize="words"
                  />
                  <AuthBirthDateField
                    label="Fecha de nacimiento"
                    value={birthdate}
                    onChangeIso={setBirthdate}
                  />
                  <AuthPhoneField
                    label="Teléfono móvil"
                    country={phoneCountry}
                    onSelectCountry={setPhoneCountry}
                    nationalDigits={phoneNational}
                    onChangeNationalDigits={setPhoneNational}
                  />
                  <AuthTextField
                    label="Correo electrónico"
                    placeholder="correo"
                    value={email}
                    onChangeText={setEmail}
                    icon={Mail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <View>
                    <AuthTextField
                      label="Contraseña"
                      placeholder="······"
                      value={password}
                      onChangeText={setPassword}
                      icon={Lock}
                      secureTextEntry={!passwordVisible}
                      rightAccessory={
                        <PasswordVisibilityToggle
                          visible={passwordVisible}
                          onToggle={() => setPasswordVisible((v) => !v)}
                        />
                      }
                    />
                    <AuthPasswordStrength password={password} />
                  </View>

                  <View style={[Layout.termsRow, styles.termsRowDense]}>
                    <Pressable
                      onPress={() => setTermsAccepted((v) => !v)}
                      style={[
                        styles.checkbox,
                        {
                          borderColor: PrismColors.primaryBorder,
                          backgroundColor: termsAccepted
                            ? PrismColors.primary
                            : PrismColors.surface,
                        },
                      ]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: termsAccepted }}
                    >
                      {termsAccepted ? (
                        <Text style={TextStyles.checkboxMark}>✓</Text>
                      ) : null}
                    </Pressable>
                    <Text style={[TextStyles.terms, styles.termsWrap]}>
                      Acepto los{" "}
                      <Text
                        style={TextStyles.link}
                        onPress={() =>
                          Alert.alert("Términos", "Contenido próximamente.")
                        }
                      >
                        Términos del servicio
                      </Text>{" "}
                      y la{" "}
                      <Text
                        style={TextStyles.link}
                        onPress={() =>
                          Alert.alert("Privacidad", "Contenido próximamente.")
                        }
                      >
                        Política de privacidad
                      </Text>
                      .
                    </Text>
                  </View>

                  <AuthPrimaryButton
                    title="Crear cuenta"
                    onPress={handleSubmit}
                    loading={loading}
                  />
                </View>
              </AuthCard>

              <View style={[Layout.rowWrapCenter, styles.footer]}>
                <Text style={[TextStyles.bodyMedium, styles.footerMuted]}>
                  ¿Ya tenés cuenta?
                </Text>
                <Link href="/login" asChild>
                  <Pressable hitSlop={8}>
                    <Text style={TextStyles.link}>Iniciar sesión</Text>
                  </Pressable>
                </Link>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <AuthHelpButton />
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    maxWidth: 460,
    width: "100%",
    alignSelf: "center",
  },
  sectionHeader: {
    marginBottom: Spacing.xl,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
  termsRowDense: {
    paddingTop: 0,
    marginLeft: 0,
  },
  checkbox: {
    marginTop: 2,
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  termsWrap: {
    flex: 1,
  },
  footer: {
    marginTop: Spacing.sm,
  },
  footerMuted: {
    textAlign: "center",
  },
});
