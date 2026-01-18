import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Divider } from 'react-native-paper';
import { AuthStackScreenProps } from '@navigation/types';
import { useAppTheme } from '@hooks/useAppTheme';
import { signInWithGoogleOAuth, supabase } from '@services/supabase';
import * as WebBrowser from 'expo-web-browser';
import AuthLayout from './components/AuthLayout';
import AuthErrorMessage from './components/AuthErrorMessage';
import { useLogin } from './hooks/useLogin';

WebBrowser.maybeCompleteAuthSession();

type Props = AuthStackScreenProps<'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { paperTheme } = useAppTheme();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    togglePasswordVisibility,
    isLoading,
    error,
    handleLogin,
  } = useLogin();

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setGoogleError(null);

    try {
      const { url } = await signInWithGoogleOAuth();

      if (url) {
        // Open browser for OAuth
        const result = await WebBrowser.openAuthSessionAsync(
          url,
          'walkingapp://'
        );

        if (result.type === 'success' && result.url) {
          // Extract tokens from redirect URL
          const redirectUrl = result.url;

          // Supabase redirects with tokens in URL fragment (after #)
          // Format: walkingapp://#access_token=...&refresh_token=...
          const hashIndex = redirectUrl.indexOf('#');

          if (hashIndex !== -1) {
            const fragment = redirectUrl.substring(hashIndex + 1);
            const params = new URLSearchParams(fragment);

            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (accessToken && refreshToken) {
              // Create session - Supabase validates tokens before creating session
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (sessionError) {
                throw sessionError;
              }

              // Session created successfully - auth state listener will handle navigation
            } else {
              setGoogleError('Failed to extract authentication tokens');
            }
          } else {
            setGoogleError('Invalid redirect URL format');
          }
        } else if (result.type === 'cancel') {
          setGoogleError('Sign in was cancelled');
        }
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err.message || 'Unknown error');
      setGoogleError(err.message || 'Failed to sign in with Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back!" subtitle="Sign in to continue">
      <View>
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          mode="outlined"
          style={styles.input}
          disabled={isLoading || isGoogleLoading}
          left={<TextInput.Icon icon="email" />}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete="password"
          mode="outlined"
          style={styles.input}
          disabled={isLoading || isGoogleLoading}
          left={<TextInput.Icon icon="lock" />}
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={togglePasswordVisibility}
            />
          }
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
          disabled={isLoading || isGoogleLoading}
          style={styles.forgotPassword}
        >
          <Text
            variant="bodyMedium"
            style={{ color: paperTheme.colors.primary }}
          >
            Forgot Password?
          </Text>
        </TouchableOpacity>

        <AuthErrorMessage error={error} />

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={isLoading}
          disabled={isLoading || isGoogleLoading}
          style={styles.button}
        >
          Sign In
        </Button>

        <View style={styles.dividerContainer}>
          <Divider style={styles.divider} />
          <Text variant="bodyMedium" style={styles.dividerText}>
            OR
          </Text>
          <Divider style={styles.divider} />
        </View>

        <AuthErrorMessage error={googleError} />

        <Button
          mode="outlined"
          icon="google"
          onPress={handleGoogleSignIn}
          loading={isGoogleLoading}
          disabled={isLoading || isGoogleLoading}
          style={styles.button}
        >
          Continue with Google
        </Button>

        <View style={styles.footer}>
          <Text variant="bodyMedium">Don't have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            disabled={isLoading || isGoogleLoading}
          >
            <Text
              variant="bodyMedium"
              style={{ color: paperTheme.colors.primary, fontWeight: '600' }}
            >
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  input: {
    marginBottom: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  button: {
    marginBottom: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
});
