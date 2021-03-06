import React, { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

import {
  useItems,
  useTransfers,
  useCurrentUser,
  useAppStatus,
} from '../services';

const io = require('socket.io-client');
const { REACT_APP_SERVER_PORT } = process.env;

const Sockets = () => {
  const socket = useRef();
  const { getItemById } = useItems();
  const { getTransfersByUser } = useTransfers();
  const { userState } = useCurrentUser();
  const { getAppStatus } = useAppStatus();

  useEffect(() => {
    socket.current = io(`http://localhost:${REACT_APP_SERVER_PORT}`);

    socket.current.on('ERROR', ({ itemId, errorCode } = {}) => {
      const msg = `Item ${itemId}: Item Error ${errorCode}`;
      console.error(msg);
      toast.error(msg);
      getItemById(itemId, true);
    });

    socket.current.on('PENDING_EXPIRATION', ({ itemId } = {}) => {
      const msg = `Item ${itemId}: Access consent is expiring in 7 days. User should re-enter login credentials.`;
      console.log(msg);
      toast(msg);
      getItemById(itemId, true);
    });

    socket.current.on('TRANSFER_EVENTS_UPDATE', async () => {
      try {
        await toast(`New Webhook Event: Transfer Events Update`);
        await getTransfersByUser(userState.currentUser.id);
        await getAppStatus();
      } catch (err) {
        console.error(err);
      }
    });

    socket.current.on('NO_NEW_EVENTS', async () => {
      try {
        await toast.error(`New Webhook Event: No new events`);
      } catch (err) {
        console.error(err);
      }
    });

    return () => {
      socket.current.removeAllListeners();
      socket.current.close();
    };
  }, [getAppStatus, getTransfersByUser, getItemById, userState.currentUser.id]);

  return <div />;
};

Sockets.displayName = 'Sockets';
export default Sockets;
