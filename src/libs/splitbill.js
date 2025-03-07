/*
 * Bill Calculation module untuk SplitBill
 * Module ini untuk handling semua perhitungan bill dengan logic:
 * - Menghitung jumlah yang harus dibayar tiap orang
 * - Support multiple splitting methods (equal, percentage, by item)
 * - Menghitung tax dan service fee
 */

// Enum untuk method splitting
export const SPLIT_METHODS = {
  EQUAL: 'equal',
  PERCENTAGE: 'percentage',
  BY_ITEM: 'byItem',
};

/*
 * Menghitung total jumlah semua item dalam bill
 * total adalah akumulator, yang nyimpen jumlah total dari semua item
 * item adalah item yang sedang dihitung
 * item.price adalah harga dari setiap item
 * parseFloat()
 * || 0 itu fallback, kalau harganya nggak valid (bakal jadi 0)
 * nilai awal total adalah 0
 */
export const calculateItemsTotal = (items) => {
  return items.reduce(
    (total, item) => total + (parseFloat(item.price) || 0),
    0
  );
};

//Hitung tax amount based on subtotal dan tax percentage-nya
export const calculateTax = (subtotal, taxPercentage) => {
  return subtotal * (taxPercentage / 100);
};

//Hitung service fee amount based on subtotal dan service fee percentage-nya
export const calculateServiceFee = (subtotal, serviceFeePercentage) => {
  return subtotal * (serviceFeePercentage / 100);
};

/*
 * Hitung total bills termasuk tax dan service fee
 * .toFixed(2) dan parseFloat() untuk mastiin semua format penulisan angka menggunakan 2 decimal
 */
export const calculateBillTotals = (
  items,
  taxPercentage = 0,
  serviceFeePercentage = 0
) => {
  const subtotal = calculateItemsTotal(items);
  const tax = calculateTax(subtotal, taxPercentage);
  const serviceFee = calculateServiceFee(subtotal, serviceFeePercentage);
  const total = subtotal + tax + serviceFee;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    serviceFee: parseFloat(serviceFee.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
  };
};

//Split bill equally buat semua orang
export const splitEquallyByTotal = (total, people) => {
  const splitAmount = total / people.length;

  return people.map((person) => ({
    ...person, // spread operator, ngambil semua properti dari orang
    amountOwed: parseFloat(splitAmount.toFixed(2)), // jumlah yang harus dibayar
    splitMethod: SPLIT_METHODS.EQUAL, // metode pembagian (equal)
    items: [], // array kosong untuk items-nya
  }));
};

//Split bill by percentage untuk masing-masing  person
export const splitByPercentage = (total, people) => {
  let remainingAmount = total; // sisa uang yang belum dibagi
  let remainingPercentage = 100; // sisa persentase yang belum dialokasiin

  // First pass: calculate amounts untuk semua, kecuali last person
  const result = people.map((person, index) => {
    // For the last person, assign sisa uang/ remaining amount
    if (index === people.length - 1) {
      return {
        ...person,
        amountOwed: parseFloat(remainingAmount.toFixed(2)), // dapat sisa uang
        splitMethod: SPLIT_METHODS.PERCENTAGE,
        percentageShare: remainingPercentage, // dapat sisa persentase
        items: [],
      };
    }

    const amount = total * (person.percentageShare / 100); // hitung jumlah berdasarkan persentase
    remainingAmount -= amount; // update sisa uang
    remainingPercentage -= person.percentageShare; // update sisa persentase

    return {
      ...person,
      amountOwed: parseFloat(amount.toFixed(2)),
      splitMethod: SPLIT_METHODS.PERCENTAGE,
      items: [],
    };
  });

  return result;
};

//Split bill dengan cara assign item spesifik ke people
export const splitByItems = (
  items, // array item-item yang dibeli
  people, // array orang-orang yang terlibat
  billTotals, // object berisi total tagihan, tax, sama service fee
  extraCostsSplitMethod = SPLIT_METHODS.EQUAL // metode pembagian biaya tambahan
) => {
  // Bikin mapping dari person ID untuk ke person object untuk quick lookups
  const personMap = people.reduce((map, person) => {
    map[person.id] = {
      ...person,
      items: [], // nyimpen item yang dibeli
      itemsSubtotal: 0, // total harga item
      amountOwed: 0, // jumlah yang harus dibayar
      splitMethod: SPLIT_METHODS.BY_ITEM,
    };
    return map;
  }, {});

  // Assign items untuk yang punya
  items.forEach((item) => {
    if (item.assignedTo && item.assignedTo.length > 0) {
      // Kalau item dibagi ke beberapa orang
      if (item.assignedTo.length > 1) {
        const splitPrice = parseFloat(item.price) / item.assignedTo.length;

        item.assignedTo.forEach((personId) => {
          if (personMap[personId]) {
            const splitItem = { ...item, splitPrice };
            personMap[personId].items.push(splitItem);
            personMap[personId].itemsSubtotal += splitPrice;
          }
        });
      } else {
        // Kalau item untuk satu orang aja
        const personId = item.assignedTo[0];
        if (personMap[personId]) {
          personMap[personId].items.push(item);
          personMap[personId].itemsSubtotal += parseFloat(item.price);
        }
      }
    }
  });

  // Hitung extra costs (tax sama service fee) untuk tiap person
  const { tax, serviceFee, subtotal } = billTotals;
  const extraCosts = tax + serviceFee;

  if (extraCostsSplitMethod === SPLIT_METHODS.EQUAL) {
    // Kalau pembagian biaya tambahannya sama rata
    const extraCostsPerPerson = extraCosts / people.length;

    Object.values(personMap).forEach((person) => {
      person.amountOwed = parseFloat(
        (person.itemsSubtotal + extraCostsPerPerson).toFixed(2)
      );
    });
  } else if (extraCostsSplitMethod === SPLIT_METHODS.PERCENTAGE) {
    // Kalau pembagian biaya tambahan proporsional dari subtotalnya
    Object.values(personMap).forEach((person) => {
      const proportion = person.itemsSubtotal / subtotal;
      const personExtraCosts = extraCosts * proportion;
      person.amountOwed = parseFloat(
        (person.itemsSubtotal + personExtraCosts).toFixed(2)
      );
    });
  }

  return Object.values(personMap);
};

// Hitung ringkasan (Summary) tagihan dari tiap person
export const calculateBillSummary = (
  items, // array item-item yang dibeli
  people, // array orang-orang yang terlibat
  splitMethod = SPLIT_METHODS.EQUAL, // metode pembagian (default: EQUAL)
  taxPercentage = 0, // persentase pajak (default: 0)
  serviceFeePercentage = 0, // persentase biaya layanan (default: 0)
  extraCostsSplitMethod = SPLIT_METHODS.EQUAL // metode pembagian biaya tambahan (default: EQUAL)
) => {
  // Hitung total tagihan dulu di sini
  const billTotals = calculateBillTotals(
    items,
    taxPercentage,
    serviceFeePercentage
  );
  let peopleWithAmounts = [];

  switch (splitMethod) {
    case SPLIT_METHODS.EQUAL: // pembagian sama rata
      peopleWithAmounts = splitEquallyByTotal(billTotals.total, people);
      break;

    case SPLIT_METHODS.PERCENTAGE: // pembagian berdasarkan persentas
      peopleWithAmounts = splitByPercentage(billTotals.total, people);
      break;

    case SPLIT_METHODS.BY_ITEM: // pembagian berdasarkan item
      peopleWithAmounts = splitByItems(
        items,
        people,
        billTotals,
        extraCostsSplitMethod
      );
      break;

    default: /// default ke pembagian sama rata
      peopleWithAmounts = splitEquallyByTotal(billTotals.total, people);
  }

  // Urutin people dari amount owed (tertinggi/terbanyak, di atas)
  peopleWithAmounts.sort((a, b) => b.amountOwed - a.amountOwed);

  return {
    billTotals, // informasi total tagihan
    people: peopleWithAmounts, // informasi pembayaran per orang
  };
};

/*
 * Generate a simplified summary dalam bentuk dynamic text untuk di-share
 * pakai method formatCurrency() untuk memformat angka ke format mata uang yang sesuai, Rp
 */
export const generateSharableSummary = (
  billSummary, // Objek yang isinya informasi tagihan dan pembagiannya
  billName = 'Split Bill' // nama tagihan (default: 'Split Bill')
) => {
  const { billTotals, people } = billSummary;

  // Header, dengan emoji
  let summaryText = `📝 Rekapitulasi Tagihan ${billName} 📝\n\n`;
  summaryText += `Subtotal: ${formatCurrency(billTotals.subtotal)}\n`;

  // tax
  if (billTotals.tax > 0) {
    summaryText += `Tax: ${formatCurrency(billTotals.tax)}\n`;
  }
  // service fee
  if (billTotals.serviceFee > 0) {
    summaryText += `Service Fee: ${formatCurrency(billTotals.serviceFee)}\n`;
  }
  // total
  summaryText += `Total: ${formatCurrency(billTotals.total)}\n\n`;
  // yang harus dibayar
  summaryText += `💰 Yang Harus Dibayar 💰\n`;
  // detail per orangnya (nama orang: tagihannya berapa)
  people.forEach((person) => {
    summaryText += `${person.name}: ${formatCurrency(person.amountOwed)}\n`;
  });

  //footer biar keren
  summaryText += `\nPakai SplitBill, Biar Siapa Bayar Berapa, Makin Jelas!`;

  return summaryText;
};

/*
 * Helper function, untuk format angka jadi format mata uang
 * karena locale= 'id-ID' (Indonesia), maka currency= 'IDR' atau 'Rp'(Rupiah)
 */
export const formatCurrency = (amount, locale = 'id-ID', currency = 'IDR') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency', // format mata uang
    currency: currency, // jenis mata uang (IDR)
    minimumFractionDigits: 0, // minimal angka di belakang koma
    maximumFractionDigits: 0, // maksimal angka di belakang koma
  }).format(amount);
};

// function buat Validasi, total persentase pembagian udah 100% apa belum
export const validatePercentageSplit = (people) => {
  const totalPercentage = people.reduce((sum, person) => {
    return sum + (person.percentageShare || 0);
  }, 0);

  return Math.abs(totalPercentage - 100) < 0.01; // validasi total, ngambil nilai absolut, ngecek apakah selisih 100 kurang dari 0.01 (karena untuk pembulatan floating point, kan)
};

const splitBillModule = {
  SPLIT_METHODS,
  calculateBillTotals,
  calculateBillSummary,
  generateSharableSummary,
  validatePercentageSplit,
  formatCurrency,
};

export default splitBillModule;
