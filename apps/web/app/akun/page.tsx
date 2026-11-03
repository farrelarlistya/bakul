"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { findWilayah, WILAYAH, type Address } from "@bakul/shared";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Field } from "@/components/field";
import { Icon } from "@/components/icon";
import { SkeletonRow } from "@/components/skeleton";
import { StatusBanner } from "@/components/status-banner";
import { useToast } from "@/components/toast";
import {
  cardClass,
  dangerButtonClass,
  errorBoxClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  selectClass,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";

type AddressForm = {
  label: string;
  recipientName: string;
  phone: string;
  provinceId: string;
  cityId: string;
  districtId: string;
  postalCode: string;
  fullAddress: string;
  isDefault: boolean;
};

const ROLE_LABEL: Record<string, string> = {
  BUYER: "Pembeli",
  SELLER: "Penjual",
  ADMIN: "Admin",
  OPERATOR_DEMO: "Operator demo",
};

function emptyAddress(userName: string, phone: string, isDefault = false): AddressForm {
  const area = WILAYAH[0];
  return {
    label: "Rumah",
    recipientName: userName,
    phone,
    provinceId: area?.provinceId ?? "",
    cityId: area?.cityId ?? "",
    districtId: area?.districtId ?? "",
    postalCode: area?.postalCode ?? "",
    fullAddress: "",
    isDefault,
  };
}

export default function AkunPage() {
  const router = useRouter();
  const { status, user, request, refreshUser, logout } = useAuth();
  const { notify } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressMessage, setAddressMessage] = useState<string | null>(null);
  const [addressFormError, setAddressFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyAddress("", "", true));
  const [addressBusy, setAddressBusy] = useState(false);
  const [hapusAlamatDialog, setHapusAlamatDialog] = useState<Address | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }
    setName(user.name);
    setEmail(user.email ?? "");
    setForm((current) => ({
      ...current,
      recipientName: current.recipientName || user.name,
      phone: current.phone || user.phone,
    }));
  }, [user]);

  useEffect(() => {
    if (!editingId) {
      setForm((current) => ({ ...current, isDefault: addresses.length === 0 }));
    }
  }, [addresses.length, editingId]);

  useEffect(() => {
    if (status !== "masuk") {
      return;
    }

    let alive = true;
    setAddressLoading(true);

    void request<Address[]>("/api/v1/me/addresses")
      .then((items) => {
        if (alive) {
          setAddresses(items);
          setAddressError(null);
        }
      })
      .catch((caught: unknown) => {
        if (alive) {
          setAddressError(caught instanceof Error ? caught.message : "Alamat belum bisa dimuat.");
        }
      })
      .finally(() => {
        if (alive) {
          setAddressLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, [status, request]);

  async function simpanProfil(): Promise<void> {
    if (name.trim().length < 2) {
      setNameError("Nama perlu minimal 2 huruf.");
      return;
    }

    setProfileBusy(true);
    setProfileMessage(null);
    setProfileError(null);

    try {
      await request("/api/v1/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() ? email.trim() : null,
        }),
      });
      await refreshUser();
      setProfileMessage("Profil tersimpan.");
      notify("Profil tersimpan.");
    } catch (caught: unknown) {
      setProfileError(caught instanceof Error ? caught.message : "Profil belum bisa disimpan.");
    } finally {
      setProfileBusy(false);
    }
  }

  function pilihKota(cityId: string): void {
    const area = findWilayah(cityId);
    if (!area) {
      return;
    }

    setForm((current) => ({
      ...current,
      cityId: area.cityId,
      provinceId: area.provinceId,
      districtId: area.districtId,
      postalCode: area.postalCode,
    }));
  }

  function ubahAlamat(address: Address): void {
    setEditingId(address.id);
    setAddressMessage(null);
    setAddressError(null);
    setAddressFormError(null);
    setForm({
      label: address.label,
      recipientName: address.recipientName,
      phone: address.phone,
      provinceId: address.provinceId,
      cityId: address.cityId,
      districtId: address.districtId,
      postalCode: address.postalCode,
      fullAddress: address.fullAddress,
      isDefault: address.isDefault,
    });
    window.scrollTo({ top: document.body.scrollHeight });
  }

  function batalUbah(): void {
    setEditingId(null);
    setAddressError(null);
    setAddressFormError(null);
    setForm(emptyAddress(user?.name ?? "", user?.phone ?? "", addresses.length === 0));
  }

  async function simpanAlamat(): Promise<void> {
    if (!form.label.trim()) {
      setAddressFormError("Beri nama alamat, misalnya Rumah atau Kantor.");
      return;
    }
    if (!form.recipientName.trim()) {
      setAddressFormError("Tulis nama lengkap penerima.");
      return;
    }
    if (!form.phone.trim()) {
      setAddressFormError("Tulis nomor HP penerima.");
      return;
    }
    if (!form.fullAddress.trim()) {
      setAddressFormError("Tulis alamat lengkap beserta patokan.");
      return;
    }

    setAddressBusy(true);
    setAddressError(null);
    setAddressMessage(null);
    setAddressFormError(null);

    try {
      if (editingId) {
        await request(`/api/v1/me/addresses/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });
      } else {
        await request("/api/v1/me/addresses", {
          method: "POST",
          body: JSON.stringify(form),
        });
      }

      const items = await request<Address[]>("/api/v1/me/addresses");
      setAddresses(items);
      setAddressMessage(editingId ? "Alamat diubah." : "Alamat ditambahkan.");
      notify(editingId ? "Alamat diubah." : "Alamat ditambahkan.");
      setEditingId(null);
      setForm(emptyAddress(user?.name ?? "", user?.phone ?? "", items.length === 0));
    } catch (caught: unknown) {
      setAddressError(caught instanceof Error ? caught.message : "Alamat belum bisa disimpan.");
    } finally {
      setAddressBusy(false);
    }
  }

  async function hapusAlamat(address: Address): Promise<void> {
    setHapusAlamatDialog(null);
    setAddressBusy(true);
    setAddressError(null);
    setAddressMessage(null);

    try {
      await request(`/api/v1/me/addresses/${address.id}`, { method: "DELETE" });
      const items = await request<Address[]>("/api/v1/me/addresses");
      setAddresses(items);
      setAddressMessage("Alamat dihapus.");
      notify("Alamat dihapus.");
      if (editingId === address.id) {
        batalUbah();
      }
    } catch (caught: unknown) {
      setAddressError(caught instanceof Error ? caught.message : "Alamat belum bisa dihapus.");
    } finally {
      setAddressBusy(false);
    }
  }

  async function jadikanUtama(address: Address): Promise<void> {
    setAddressBusy(true);
    setAddressError(null);

    try {
      await request(`/api/v1/me/addresses/${address.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isDefault: true }),
      });
      const items = await request<Address[]>("/api/v1/me/addresses");
      setAddresses(items);
      setAddressMessage("Alamat utama diganti.");
      notify("Alamat utama diganti.");
    } catch (caught: unknown) {
      setAddressError(caught instanceof Error ? caught.message : "Alamat utama belum bisa diganti.");
    } finally {
      setAddressBusy(false);
    }
  }

  async function keluar(): Promise<void> {
    await logout();
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-krem pb-24 md:pb-0">
      <AppHeader />
      <div className="mx-auto max-w-[1200px] px-4 py-8">
        <h1 className="font-display text-3xl font-bold text-tinta">Akun</h1>
        <p className="mt-2 text-base text-tinta-lembut">
          Profil, alamat, dan toko kamu dalam satu tempat.
        </p>

        {status === "memuat" ? (
          <div className={`${cardClass} mt-6`}>
            <p className="text-base text-tinta-lembut">Memeriksa sesi…</p>
          </div>
        ) : null}

        {status === "tamu" ? (
          <EmptyState
            icon="user"
            title="Masuk dulu, ya"
            description="Nomor HP dan kode 6 angka sudah cukup."
            action={{ label: "Masuk", href: "/masuk" }}
            className="mt-6"
          />
        ) : null}

        {status === "masuk" && user ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <section className={cardClass} aria-labelledby="profil">
                <h2 id="profil" className="font-display text-2xl font-bold text-tinta">
                  Profil
                </h2>
                <p className="mt-1 text-base text-tinta-lembut">
                  {user.phone} · {ROLE_LABEL[user.role] ?? user.role}
                </p>

                <div className="mt-4 space-y-4">
                  <Field label="Nama" htmlFor="profile-name" error={nameError}>
                    {(props) => (
                      <input
                        {...props}
                        className={inputClass}
                        value={name}
                        onChange={(event) => {
                          setName(event.target.value);
                          if (nameError) {
                            setNameError(null);
                          }
                        }}
                      />
                    )}
                  </Field>
                  <Field label="Email" htmlFor="profile-email" hint="Tidak wajib diisi.">
                    {(props) => (
                      <input
                        {...props}
                        type="email"
                        className={inputClass}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="Tidak wajib diisi"
                      />
                    )}
                  </Field>

                  {profileError ? (
                    <div className={errorBoxClass} role="alert">
                      {profileError}
                    </div>
                  ) : null}
                  {profileMessage ? (
                    <div role="status">
                      <StatusBanner tone="sukses">{profileMessage}</StatusBanner>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    className={`${primaryButtonClass} w-full`}
                    disabled={profileBusy || name.trim().length < 2}
                    aria-busy={profileBusy}
                    onClick={() => void simpanProfil()}
                  >
                    {profileBusy ? (
                      <>
                        <Icon name="refresh" size={18} className="animate-memuat" />
                        Menyimpan…
                      </>
                    ) : (
                      "Simpan profil"
                    )}
                  </button>
                </div>
              </section>

              <section className={cardClass} aria-labelledby="toko">
                <h2 id="toko" className="font-display text-2xl font-bold text-tinta">
                  Toko
                </h2>
                {user.shop ? (
                  <>
                    <p className="mt-2 text-lg font-semibold text-tinta">{user.shop.name}</p>
                    <p className="text-base text-tinta-lembut">{user.shop.cityName}</p>
                    <Link href="/jualan/barang" className={`${primaryButtonClass} mt-4 w-full`}>
                      Kelola barang
                    </Link>
                    <Link href="/jualan/pesanan" className={`${secondaryButtonClass} mt-2 w-full`}>
                      Pesanan masuk
                    </Link>
                    <Link href="/jualan/dompet" className={`${secondaryButtonClass} mt-2 w-full`}>
                      Dompet toko
                    </Link>
                    <Link href="/jualan/toko" className={`${secondaryButtonClass} mt-2 w-full`}>
                      Pengaturan toko
                    </Link>
                    <Link href={`/toko/${user.shop.slug}`} className={`${secondaryButtonClass} mt-2 w-full`}>
                      Lihat halaman toko
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-base text-tinta-lembut">
                      Belum punya toko. Buka gratis, cukup nomor HP.
                    </p>
                    <Link href="/jualan" className={`${primaryButtonClass} mt-4 w-full`}>
                      Buka toko
                    </Link>
                  </>
                )}
              </section>

              {user.role === "ADMIN" || user.role === "OPERATOR_DEMO" ? (
                <section className={cardClass}>
                  <h2 className="font-display text-2xl font-bold text-tinta">Tim internal</h2>
                  <p className="mt-2 text-base text-tinta-lembut">
                    Dashboard admin dan simulator demo.
                  </p>
                  {user.role === "ADMIN" ? (
                    <Link href="/admin" className={`${primaryButtonClass} mt-4 w-full`}>
                      Dashboard admin
                    </Link>
                  ) : null}
                  <Link href="/dev" className={`${secondaryButtonClass} mt-2 w-full`}>
                    Demo console
                  </Link>
                </section>
              ) : null}

              <section className={cardClass}>
                <h2 className="font-display text-2xl font-bold text-tinta">Sesi</h2>
                <p className="mt-2 text-base text-tinta-lembut">
                  Keluar dari perangkat ini. Kamu bisa masuk lagi dengan kode.
                </p>
                <button
                  type="button"
                  className={`${secondaryButtonClass} mt-4 w-full`}
                  onClick={() => void keluar()}
                >
                  Keluar
                </button>
              </section>
            </div>

            <section className={cardClass} aria-labelledby="alamat">
              <h2 id="alamat" className="font-display text-2xl font-bold text-tinta">
                Alamat pengiriman
              </h2>
              <p className="mt-2 text-base text-tinta-lembut">
                Simpan alamat rumah atau kantor. Satu alamat jadi utama.
              </p>

              {addressLoading ? (
                <div className="mt-4 space-y-3">
                  <SkeletonRow />
                  <SkeletonRow />
                </div>
              ) : null}

              <div className="mt-4 space-y-3">
                {addresses.map((address) => (
                  <article
                    key={address.id}
                    className="rounded-kartu border border-garis bg-abu-kartu p-4 transition duration-sedang ease-standar hover:border-garis-kuat"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-lg font-semibold text-tinta">{address.label}</p>
                      {address.isDefault ? (
                        <span className="inline-flex min-h-8 items-center gap-1 rounded-pil bg-mint px-3 text-base font-semibold text-teal-tua">
                          <Icon name="check" size={16} />
                          Utama
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-base text-tinta">
                      {address.recipientName} · {address.phone}
                    </p>
                    <p className="mt-1 text-base text-tinta-lembut">{address.fullAddress}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        onClick={() => ubahAlamat(address)}
                      >
                        <Icon name="edit" size={18} />
                        Ubah
                      </button>
                      {!address.isDefault ? (
                        <button
                          type="button"
                          className={secondaryButtonClass}
                          disabled={addressBusy}
                          onClick={() => void jadikanUtama(address)}
                        >
                          Jadikan utama
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={dangerButtonClass}
                        disabled={addressBusy}
                        onClick={() => setHapusAlamatDialog(address)}
                      >
                        <Icon name="trash" size={18} />
                        Hapus
                      </button>
                    </div>
                  </article>
                ))}
                {!addressLoading && addresses.length === 0 ? (
                  <EmptyState
                    icon="pin"
                    title="Belum ada alamat tersimpan"
                    description="Tambahkan alamat supaya ongkir bisa dihitung saat bayar."
                  />
                ) : null}
              </div>

              <div className="mt-6 border-t border-garis pt-5">
                <h3 className="font-display text-xl font-bold text-tinta">
                  {editingId ? "Ubah alamat" : "Tambah alamat"}
                </h3>

                <div className="mt-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nama alamat" htmlFor="address-label">
                      {(props) => (
                        <input
                          {...props}
                          className={inputClass}
                          value={form.label}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, label: event.target.value }))
                          }
                          placeholder="Rumah atau Kantor"
                        />
                      )}
                    </Field>
                    <Field label="Nama penerima" htmlFor="address-recipient">
                      {(props) => (
                        <input
                          {...props}
                          className={inputClass}
                          value={form.recipientName}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              recipientName: event.target.value,
                            }))
                          }
                        />
                      )}
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nomor HP penerima" htmlFor="address-phone">
                      {(props) => (
                        <input
                          {...props}
                          type="tel"
                          inputMode="tel"
                          className={inputClass}
                          value={form.phone}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, phone: event.target.value }))
                          }
                        />
                      )}
                    </Field>
                    <Field label="Kota" htmlFor="address-city">
                      {(props) => (
                        <select
                          {...props}
                          className={selectClass}
                          value={form.cityId}
                          onChange={(event) => pilihKota(event.target.value)}
                        >
                          {WILAYAH.map((city) => (
                            <option key={city.cityId} value={city.cityId}>
                              {city.cityName}, {city.provinceName}
                            </option>
                          ))}
                        </select>
                      )}
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className={labelClass}>Kecamatan</p>
                      <p className="flex min-h-11 items-center rounded-tombol border border-garis bg-abu-kartu px-3 text-base text-tinta">
                        {findWilayah(form.cityId)?.districtName ?? "Ikut kota"}
                      </p>
                    </div>
                    <Field label="Kode pos" htmlFor="address-postal">
                      {(props) => (
                        <input
                          {...props}
                          inputMode="numeric"
                          className={inputClass}
                          value={form.postalCode}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              postalCode: event.target.value.replace(/\D/g, "").slice(0, 5),
                            }))
                          }
                        />
                      )}
                    </Field>
                  </div>

                  <Field
                    label="Alamat lengkap"
                    htmlFor="address-full"
                    hint="Jalan, nomor rumah, dan patokan."
                  >
                    {(props) => (
                      <textarea
                        {...props}
                        className={`${inputClass} min-h-24 py-3`}
                        value={form.fullAddress}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            fullAddress: event.target.value,
                          }))
                        }
                        placeholder="Jalan, nomor rumah, patokan"
                      />
                    )}
                  </Field>

                  <label className="flex min-h-11 items-center gap-3 text-base text-tinta">
                    <input
                      type="checkbox"
                      className="h-6 w-6 shrink-0 accent-teal-aksi"
                      checked={form.isDefault}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          isDefault: event.target.checked,
                        }))
                      }
                    />
                    Jadikan alamat utama
                  </label>

                  {addressError ? (
                    <div className={errorBoxClass} role="alert">
                      {addressError}
                    </div>
                  ) : null}
                  {addressFormError ? (
                    <div className={errorBoxClass} role="alert">
                      {addressFormError}
                    </div>
                  ) : null}
                  {addressMessage ? (
                    <div role="status">
                      <StatusBanner tone="sukses">{addressMessage}</StatusBanner>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      className={primaryButtonClass}
                      disabled={addressBusy}
                      aria-busy={addressBusy}
                      onClick={() => void simpanAlamat()}
                    >
                      {addressBusy
                        ? "Menyimpan…"
                        : editingId
                          ? "Simpan perubahan"
                          : "Tambah alamat"}
                    </button>
                    {editingId ? (
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        onClick={batalUbah}
                      >
                        Batal
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </div>
      <BottomNav />

      <ConfirmDialog
        open={hapusAlamatDialog !== null}
        title="Hapus alamat ini?"
        description={
          hapusAlamatDialog
            ? `Alamat “${hapusAlamatDialog.label}” akan dihapus dari daftar.`
            : undefined
        }
        confirmLabel="Ya, hapus"
        cancelLabel="Batal"
        danger
        onConfirm={() => {
          if (hapusAlamatDialog) {
            void hapusAlamat(hapusAlamatDialog);
          }
        }}
        onCancel={() => setHapusAlamatDialog(null)}
      />
    </main>
  );
}
