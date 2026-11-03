"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { findWilayah, WILAYAH, type Address } from "@bakul/shared";
import { SiteHeader } from "@/components/site-header";
import {
  cardClass,
  dangerButtonClass,
  errorBoxClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressMessage, setAddressMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyAddress("", "", true));
  const [addressBusy, setAddressBusy] = useState(false);

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
    setForm(emptyAddress(user?.name ?? "", user?.phone ?? "", addresses.length === 0));
  }

  async function simpanAlamat(): Promise<void> {
    setAddressBusy(true);
    setAddressError(null);
    setAddressMessage(null);

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
      setEditingId(null);
      setForm(emptyAddress(user?.name ?? "", user?.phone ?? "", items.length === 0));
    } catch (caught: unknown) {
      setAddressError(caught instanceof Error ? caught.message : "Alamat belum bisa disimpan.");
    } finally {
      setAddressBusy(false);
    }
  }

  async function hapusAlamat(address: Address): Promise<void> {
    if (!window.confirm(`Hapus alamat “${address.label}”?`)) {
      return;
    }

    setAddressBusy(true);
    setAddressError(null);
    setAddressMessage(null);

    try {
      await request(`/api/v1/me/addresses/${address.id}`, { method: "DELETE" });
      const items = await request<Address[]>("/api/v1/me/addresses");
      setAddresses(items);
      setAddressMessage("Alamat dihapus.");
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
    <main className="min-h-screen bg-krem">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">
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
          <div className={`${cardClass} mt-6`}>
            <h2 className="font-display text-2xl font-bold text-tinta">Masuk dulu, ya</h2>
            <p className="mt-2 text-base text-tinta-lembut">
              Nomor HP dan kode 6 angka sudah cukup.
            </p>
            <Link href="/masuk" className={`${primaryButtonClass} mt-4 w-full`}>
              Masuk
            </Link>
          </div>
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
                  <div>
                    <label className={labelClass} htmlFor="profile-name">
                      Nama
                    </label>
                    <input
                      id="profile-name"
                      className={inputClass}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="profile-email">
                      Email <span className="font-normal text-tinta-lembut">(opsional)</span>
                    </label>
                    <input
                      id="profile-email"
                      type="email"
                      className={inputClass}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Tidak wajib diisi"
                    />
                  </div>

                  {profileError ? (
                    <div className={errorBoxClass} role="alert">
                      {profileError}
                    </div>
                  ) : null}
                  {profileMessage ? (
                    <p className="rounded-kartu bg-mint-muda p-3 text-base text-teal-aksi">
                      {profileMessage}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    className={`${primaryButtonClass} w-full`}
                    disabled={profileBusy || name.trim().length < 2}
                    onClick={() => void simpanProfil()}
                  >
                    {profileBusy ? "Menyimpan…" : "Simpan profil"}
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
                    <Link href="/jualan" className={`${secondaryButtonClass} mt-4 w-full`}>
                      Lihat toko
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
                <p className="mt-4 text-base text-tinta-lembut">Memuat alamat…</p>
              ) : null}

              <div className="mt-4 space-y-3">
                {addresses.map((address) => (
                  <article
                    key={address.id}
                    className="rounded-kartu border border-garis bg-abu-kartu p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-lg font-semibold text-tinta">{address.label}</p>
                      {address.isDefault ? (
                        <span className="inline-flex min-h-8 items-center rounded-pil bg-mint px-3 text-base font-semibold text-teal-aksi">
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
                        onClick={() => void hapusAlamat(address)}
                      >
                        Hapus
                      </button>
                    </div>
                  </article>
                ))}
                {!addressLoading && addresses.length === 0 ? (
                  <p className="text-base text-tinta-lembut">Belum ada alamat tersimpan.</p>
                ) : null}
              </div>

              <div className="mt-6 border-t border-garis pt-5">
                <h3 className="font-display text-xl font-bold text-tinta">
                  {editingId ? "Ubah alamat" : "Tambah alamat"}
                </h3>

                <div className="mt-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass} htmlFor="address-label">
                        Nama alamat
                      </label>
                      <input
                        id="address-label"
                        className={inputClass}
                        value={form.label}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, label: event.target.value }))
                        }
                        placeholder="Rumah atau Kantor"
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="address-recipient">
                        Nama penerima
                      </label>
                      <input
                        id="address-recipient"
                        className={inputClass}
                        value={form.recipientName}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            recipientName: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass} htmlFor="address-phone">
                        Nomor HP penerima
                      </label>
                      <input
                        id="address-phone"
                        type="tel"
                        inputMode="tel"
                        className={inputClass}
                        value={form.phone}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, phone: event.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="address-city">
                        Kota
                      </label>
                      <select
                        id="address-city"
                        className={inputClass}
                        value={form.cityId}
                        onChange={(event) => pilihKota(event.target.value)}
                      >
                        {WILAYAH.map((city) => (
                          <option key={city.cityId} value={city.cityId}>
                            {city.cityName}, {city.provinceName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className={labelClass}>Kecamatan</p>
                      <p className="flex min-h-11 items-center rounded-tombol border border-garis bg-abu-kartu px-3 text-base text-tinta">
                        {findWilayah(form.cityId)?.districtName ?? "Ikut kota"}
                      </p>
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="address-postal">
                        Kode pos
                      </label>
                      <input
                        id="address-postal"
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
                    </div>
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="address-full">
                      Alamat lengkap
                    </label>
                    <textarea
                      id="address-full"
                      className={`${inputClass} min-h-24 py-3`}
                      value={form.fullAddress}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, fullAddress: event.target.value }))
                      }
                      placeholder="Jalan, nomor rumah, patokan"
                    />
                  </div>

                  <label className="flex min-h-11 items-center gap-3 text-base text-tinta">
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-[#0F6E66]"
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
                  {addressMessage ? (
                    <p className="rounded-kartu bg-mint-muda p-3 text-base text-teal-aksi">
                      {addressMessage}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      className={primaryButtonClass}
                      disabled={addressBusy}
                      onClick={() => void simpanAlamat()}
                    >
                      {addressBusy ? "Menyimpan…" : editingId ? "Simpan perubahan" : "Tambah alamat"}
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
    </main>
  );
}
