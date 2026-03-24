#!/usr/bin/env bash
set -euo pipefail

USERNAME="${1:-AutoPulse}"
USER_HOME="/home/${USERNAME}"

echo "[INFO] stage=user-check user=${USERNAME}"
if id -u "${USERNAME}" >/dev/null 2>&1; then
  echo "[WARN] user already exists: ${USERNAME}"
else
  useradd -m -s /bin/bash "${USERNAME}"
  echo "[OK] created user: ${USERNAME}"
fi

echo "[INFO] stage=sudo-check user=${USERNAME}"
if id -nG "${USERNAME}" | tr ' ' '\n' | grep -qx sudo; then
  echo "[WARN] user already in sudo group: ${USERNAME}"
else
  usermod -aG sudo "${USERNAME}"
  echo "[OK] added user to sudo group: ${USERNAME}"
fi

echo "[INFO] stage=ssh-dir user=${USERNAME}"
install -d -m 700 -o "${USERNAME}" -g "${USERNAME}" "${USER_HOME}/.ssh"
touch "${USER_HOME}/.ssh/authorized_keys"
chown "${USERNAME}:${USERNAME}" "${USER_HOME}/.ssh/authorized_keys"
chmod 600 "${USER_HOME}/.ssh/authorized_keys"
echo "[OK] initialized ${USER_HOME}/.ssh"

echo "[INFO] stage=verify user=${USERNAME}"
id "${USERNAME}"
getent passwd "${USERNAME}"
ls -ld "${USER_HOME}"
ls -ld "${USER_HOME}/.ssh"
ls -l "${USER_HOME}/.ssh/authorized_keys"

cat <<EOF
[OK] AutoPulse bootstrap finished.
Next:
1. Append a public key into ${USER_HOME}/.ssh/authorized_keys
2. Test: ssh ${USERNAME}@$(hostname -I | awk '{print $1}')
EOF
