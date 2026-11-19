import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Choice } from '../Choice';
import { Field } from '../Field';

describe('Komponen UI Design System HIMASRI', () => {
  it('merender Button dengan state loading dan disabled', () => {
    render(
      <Button loading loadingLabel="Menyimpan…">
        Simpan
      </Button>,
    );
    const btn = screen.getByRole('button', { name: /Menyimpan/i });
    expect(btn).toBeDisabled();
  });

  it('merender Badge varian gold dan whatsapp', () => {
    render(
      <div>
        <Badge variant="gold">Pengurus Inti</Badge>
        <Badge variant="whatsapp">Tersedia</Badge>
      </div>,
    );
    expect(screen.getByText('Pengurus Inti')).toBeInTheDocument();
    expect(screen.getByText('Tersedia')).toBeInTheDocument();
  });

  it('menampilkan pesan error Field dan menghubungkan aria-describedby', () => {
    render(<Field label="NIM" required error="NIM wajib diisi" />);
    const input = screen.getByLabelText(/NIM/i);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('NIM wajib diisi');
  });

  it('mengubah nilai Choice saat diklik', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Choice
        name="aslab"
        value="ya"
        checked={false}
        onChange={onChange}
        label="Ya, saya aslab"
      />,
    );
    await user.click(screen.getByText('Ya, saya aslab'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
