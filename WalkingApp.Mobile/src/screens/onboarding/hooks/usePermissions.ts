import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Pedometer } from 'expo-sensors';
import { PermissionStatus } from '../components/PermissionCard';

export interface PermissionsState {
  notificationPermissionStatus: PermissionStatus;
  activityPermissionStatus: PermissionStatus;
  requestNotificationPermission: () => Promise<void>;
  requestActivityPermission: () => Promise<void>;
}

export function usePermissions(): PermissionsState {
  const [notificationPermissionStatus, setNotificationPermissionStatus] =
    useState<PermissionStatus>('undetermined');
  const [activityPermissionStatus, setActivityPermissionStatus] =
    useState<PermissionStatus>('undetermined');

  useEffect(() => {
    checkNotificationPermission();
    checkActivityPermission();
  }, []);

  const checkNotificationPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationPermissionStatus(
      status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined'
    );
  };

  const checkActivityPermission = async () => {
    const { status } = await Pedometer.getPermissionsAsync();
    setActivityPermissionStatus(
      status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined'
    );
  };

  const requestNotificationPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setNotificationPermissionStatus(
      status === 'granted' ? 'granted' : 'denied'
    );
  };

  const requestActivityPermission = async () => {
    const { status } = await Pedometer.requestPermissionsAsync();
    setActivityPermissionStatus(
      status === 'granted' ? 'granted' : 'denied'
    );
  };

  return {
    notificationPermissionStatus,
    activityPermissionStatus,
    requestNotificationPermission,
    requestActivityPermission,
  };
}
