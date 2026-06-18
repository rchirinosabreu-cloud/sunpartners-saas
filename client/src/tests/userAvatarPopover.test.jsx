import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import UserAvatarPopover from '../components/UserAvatarPopover';

describe('UserAvatarPopover', () => {
  const user = { nombre: 'Laura Operaciones', username: 'laura.ops', role: 'EDITOR' };

  it('shows user information while the avatar is hovered and hides it afterward', () => {
    render(<UserAvatarPopover user={user} relationship="Responsable" />);

    const avatar = screen.getByLabelText('Ver información de Laura Operaciones');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.mouseEnter(avatar);

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('Laura Operaciones')).toBeInTheDocument();
    expect(screen.getByText('Responsable')).toBeInTheDocument();
    expect(screen.getByText('@laura.ops')).toBeInTheDocument();

    fireEvent.mouseLeave(avatar);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
