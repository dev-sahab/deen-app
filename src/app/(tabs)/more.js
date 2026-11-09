import React from 'react';
import { useRouter } from 'expo-router';
import { Screen, Card, Row } from '../../components/ui';
import { useT } from '../../hooks/useT';

export default function More() {
  const router = useRouter();
  const { t } = useT();
  const items = [
    ['volume-mute-outline', t.autoSilent, '/silent'],
    ['compass-outline', t.qibla, '/qibla'],
    ['ellipse-outline', t.tasbih, '/tasbih'],
    ['settings-outline', t.settings, '/settings'],
  ];
  return (
    <Screen title={t.more}>
      <Card style={{ paddingVertical: 4 }}>
        {items.map(([icon, title, href]) => (
          <Row key={href} icon={icon} title={title} onPress={() => router.push(href)} />
        ))}
      </Card>
    </Screen>
  );
}
