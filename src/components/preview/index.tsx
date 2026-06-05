// src/components/preview/index.tsx
// Ecrã de pré-visualização do design system (Etapa 1.2).
// Renderiza todos os componentes base em ambos os temas (toggle manual).

import { useState, useMemo } from 'react';
import { ScrollView, View, Switch, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/state/theme.store';
import { useI18n } from '@/state/i18n.context';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { getPriorityColor, getPriorityLabel, type Priority } from '@/lib/format/priority';
import { formatSmartDate } from '@/lib/format/date';

export function PreviewScreen() {
  const { resolved, mode, setMode, colors } = useTheme();
  const { t, locale, setLocale } = useI18n();
  const [switchOn, setSwitchOn] = useState(false);

  const priorities: Priority[] = [1, 2, 3, 4];

  const dates = useMemo(() => {
    const day = 86400000;
    return {
      today: new Date(),
      tomorrow: new Date(Date.now() + day),
      weekAhead: new Date(Date.now() + 7 * day),
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView
        contentContainerClassName="p-5 gap-6"
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Header */}
        <View className="gap-1">
          <Text variant="h1">{t('preview.title')}</Text>
          <Text variant="caption">Theme: {resolved} ({mode})</Text>
        </View>

        {/* Theme switcher */}
        <Card>
          <CardHeader>
            <CardTitle>Tema</CardTitle>
            <CardDescription>Auto segue o sistema, ou escolhe manualmente.</CardDescription>
          </CardHeader>
          <CardContent className="flex-row gap-2 flex-wrap">
            <Button title={t('theme.light')} variant={mode === 'light' ? 'primary' : 'outline'} size="sm" onPress={() => setMode('light')} />
            <Button title={t('theme.dark')} variant={mode === 'dark' ? 'primary' : 'outline'} size="sm" onPress={() => setMode('dark')} />
            <Button title={t('theme.system')} variant={mode === 'system' ? 'primary' : 'outline'} size="sm" onPress={() => setMode('system')} />
          </CardContent>
        </Card>

        {/* Locale switcher */}
        <Card>
          <CardHeader>
            <CardTitle>Idioma</CardTitle>
            <CardDescription>Detecção inicial: {locale}</CardDescription>
          </CardHeader>
          <CardContent className="flex-row gap-2">
            <Button title="pt-PT" variant={locale === 'pt' ? 'primary' : 'outline'} size="sm" onPress={() => setLocale('pt')} />
            <Button title="en-US" variant={locale === 'en' ? 'primary' : 'outline'} size="sm" onPress={() => setLocale('en')} />
          </CardContent>
        </Card>

        {/* Text variants */}
        <Card>
          <CardHeader>
            <CardTitle>Text</CardTitle>
            <CardDescription>Variantes tipográficas (Inter).</CardDescription>
          </CardHeader>
          <CardContent className="gap-1">
            <Text variant="h1">Heading 1</Text>
            <Text variant="h2">Heading 2</Text>
            <Text variant="h3">Heading 3</Text>
            <Text variant="body">Body text — exemplo de parágrafo com texto normal.</Text>
            <Text variant="caption">Caption / helper text</Text>
            <Text variant="label">Label / form label</Text>
          </CardContent>
        </Card>

        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Button</CardTitle>
            <CardDescription>Variantes e tamanhos.</CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            <View className="gap-2">
              <Button title="Primary" variant="primary" onPress={() => {}} />
              <Button title="Secondary" variant="secondary" onPress={() => {}} />
              <Button title="Outline" variant="outline" onPress={() => {}} />
              <Button title="Ghost" variant="ghost" onPress={() => {}} />
              <Button title="Destructive" variant="destructive" onPress={() => {}} />
            </View>
            <View className="flex-row gap-2">
              <Button title="Small" variant="primary" size="sm" onPress={() => {}} />
              <Button title="Medium" variant="primary" size="md" onPress={() => {}} />
              <Button title="Large" variant="primary" size="lg" onPress={() => {}} />
            </View>
            <Button title="Loading" variant="primary" loading onPress={() => {}} />
            <Button title="Disabled" variant="primary" disabled onPress={() => {}} />
          </CardContent>
        </Card>

        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>Formulários com label e helper.</CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            <Input label="Email" placeholder="nome@exemplo.com" keyboardType="email-address" />
            <Input label="Com helper" placeholder="Placeholder" helperText="Texto de ajuda opcional." />
            <Input label="Com erro" placeholder="Inválido" errorText="Este campo é obrigatório." />
            <Input label="Disabled" placeholder="Não editável" editable={false} />
          </CardContent>
        </Card>

        {/* Chips */}
        <Card>
          <CardHeader>
            <CardTitle>Chip</CardTitle>
            <CardDescription>Badges para etiquetas e prioridades.</CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            <View className="flex-row gap-2 flex-wrap">
              <Chip label="Default" variant="default" />
              <Chip label="Primary" variant="primary" />
              <Chip label="Success" variant="success" />
              <Chip label="Warning" variant="warning" />
              <Chip label="Destructive" variant="destructive" />
              <Chip label="Muted" variant="muted" />
            </View>
            <View className="gap-1">
              <Text variant="caption">Prioridades:</Text>
              <View className="flex-row gap-2 flex-wrap mt-1">
                {priorities.map((p) => (
                  <Chip
                    key={p}
                    label={getPriorityLabel(p, locale)}
                    variant="default"
                    style={{ borderColor: getPriorityColor(p), borderWidth: 1 }}
                  />
                ))}
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Icons */}
        <Card>
          <CardHeader>
            <CardTitle>Icons (Ionicons)</CardTitle>
            <CardDescription>Vector font, theme-aware.</CardDescription>
          </CardHeader>
          <CardContent className="flex-row gap-4 flex-wrap">
            <Icon name="home-outline" size={28} />
            <Icon name="calendar-outline" size={28} />
            <Icon name="add" size={28} color={colors.primary} />
            <Icon name="search-outline" size={28} />
            <Icon name="folder-outline" size={28} />
            <Icon name="settings-outline" size={28} />
            <Icon name="ellipsis-horizontal" size={28} />
            <Icon name="notifications-outline" size={28} />
          </CardContent>
        </Card>

        {/* Date formatting */}
        <Card>
          <CardHeader>
            <CardTitle>Datas (date-fns + locale)</CardTitle>
            <CardDescription>Formatação inteligente.</CardDescription>
          </CardHeader>
          <CardContent className="gap-1">
            <Text variant="body">Hoje: {formatSmartDate(dates.today, locale)}</Text>
            <Text variant="body">Amanhã: {formatSmartDate(dates.tomorrow, locale)}</Text>
            <Text variant="body">Daqui a 7 dias: {formatSmartDate(dates.weekAhead, locale)}</Text>
          </CardContent>
        </Card>

        {/* Switch demo */}
        <Card>
          <CardHeader>
            <CardTitle>Switch</CardTitle>
            <CardDescription>Wrapper básico do RN Switch.</CardDescription>
          </CardHeader>
          <CardContent className="flex-row items-center gap-3">
            <Switch value={switchOn} onValueChange={setSwitchOn} trackColor={{ true: colors.primary, false: colors.border }} />
            <Text variant="body">Switch {switchOn ? 'on' : 'off'}</Text>
          </CardContent>
        </Card>

        {/* Pressable demo */}
        <Card>
          <CardHeader>
            <CardTitle>Pressable</CardTitle>
            <CardDescription>Touch target com feedback.</CardDescription>
          </CardHeader>
          <CardContent>
            <Pressable onPress={() => {}} className="bg-muted p-3 rounded-lg active:opacity-70">
              <Text variant="body">Tocar aqui</Text>
            </Pressable>
          </CardContent>
        </Card>

        {/* Layout / flex */}
        <Card>
          <CardHeader>
            <CardTitle>Layout</CardTitle>
            <CardDescription>Flex, gap, padding via NativeWind.</CardDescription>
          </CardHeader>
          <CardContent className="flex-row gap-2">
            <View className="flex-1 h-12 bg-primary rounded" />
            <View className="flex-1 h-12 bg-secondary rounded" />
            <View className="flex-1 h-12 bg-success rounded" />
          </CardContent>
          <CardFooter>
            <Text variant="caption">flex-1, gap-2, h-12</Text>
          </CardFooter>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
