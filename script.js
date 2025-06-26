
        document.addEventListener('DOMContentLoaded', function() {
            // Değişkenler
            let transactions = JSON.parse(localStorage.getItem('budgetTransactions')) || [];
            let selectedTransactionId = null;
            const currentDate = new Date();
            
            // Tarih alanını bugünün tarihine ayarla
            document.getElementById('transaction-date').valueAsDate = currentDate;
            
            // Chart.js için renk paleti
            const chartColors = [
                '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
                '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
            ];
            
            // İşlem tipi değiştiğinde kategori listesini güncelle
            document.getElementById('transaction-type').addEventListener('change', updateCategoryOptions);
            
            // İşlem formunu dinle
            document.getElementById('transaction-form').addEventListener('submit', function(e) {
                e.preventDefault();
                
                const type = document.getElementById('transaction-type').value;
                const amount = parseFloat(document.getElementById('transaction-amount').value);
                const date = document.getElementById('transaction-date').value;
                const category = document.getElementById('transaction-category').value;
                const description = document.getElementById('transaction-description').value;
                
                // Yeni işlem oluştur
                const newTransaction = {
                    id: Date.now(),
                    type,
                    amount,
                    date,
                    category,
                    description
                };
                
                // İşlemi listeye ekle
                transactions.push(newTransaction);
                
                // Yerel depolamaya kaydet
                localStorage.setItem('budgetTransactions', JSON.stringify(transactions));
                
                // Formu temizle
                document.getElementById('transaction-form').reset();
                document.getElementById('transaction-date').valueAsDate = new Date();
                document.getElementById('transaction-type').value = 'income';
                updateCategoryOptions();
                
                // Özeti ve işlem listesini güncelle
                updateSummary();
                updateTransactionsList();
                updateCharts();
                
                // Başarılı mesajı göster
                alert('İşlem başarıyla eklendi!');
            });
            
            // Filtre değişikliklerini dinle
            document.getElementById('filter-type').addEventListener('change', updateTransactionsList);
            document.getElementById('filter-month').addEventListener('change', updateTransactionsList);
            document.getElementById('filter-category').addEventListener('change', updateTransactionsList);
            document.getElementById('chart-month').addEventListener('change', updateCharts);
            
            // Modal kapatma düğmelerini dinle
            document.getElementById('close-modal').addEventListener('click', closeModal);
            document.getElementById('close-modal-btn').addEventListener('click', closeModal);
            
            // İşlem silme düğmesini dinle
            document.getElementById('delete-transaction').addEventListener('click', function() {
                if (selectedTransactionId) {
                    if (confirm('Bu işlemi silmek istediğinizden emin misiniz?')) {
                        transactions = transactions.filter(transaction => transaction.id !== selectedTransactionId);
                        localStorage.setItem('budgetTransactions', JSON.stringify(transactions));
                        
                        updateSummary();
                        updateTransactionsList();
                        updateCharts();
                        closeModal();
                    }
                }
            });
            
            // İşlem düzenleme düğmesini dinle
            document.getElementById('edit-transaction').addEventListener('click', function() {
                if (selectedTransactionId) {
                    const transaction = transactions.find(transaction => transaction.id === selectedTransactionId);
                    if (transaction) {
                        // Form alanlarını doldur
                        document.getElementById('transaction-type').value = transaction.type;
                        updateCategoryOptions();
                        document.getElementById('transaction-amount').value = transaction.amount;
                        document.getElementById('transaction-date').value = transaction.date;
                        document.getElementById('transaction-category').value = transaction.category;
                        document.getElementById('transaction-description').value = transaction.description || '';
                        
                        // İşlemi sil
                        transactions = transactions.filter(t => t.id !== selectedTransactionId);
                        localStorage.setItem('budgetTransactions', JSON.stringify(transactions));
                        
                        // Özeti ve işlem listesini güncelle
                        updateSummary();
                        updateTransactionsList();
                        updateCharts();
                        closeModal();
                        
                        // Forma odaklan
                        document.getElementById('transaction-amount').focus();
                    }
                }
            });
            
            // Kategori seçeneklerini güncelleme fonksiyonu
            function updateCategoryOptions() {
                const transactionType = document.getElementById('transaction-type').value;
                const incomeCategories = document.getElementById('income-categories');
                const expenseCategories = document.getElementById('expense-categories');
                
                if (transactionType === 'income') {
                    incomeCategories.style.display = 'block';
                    expenseCategories.style.display = 'none';
                    document.getElementById('transaction-category').value = 'salary';
                } else {
                    incomeCategories.style.display = 'none';
                    expenseCategories.style.display = 'block';
                    document.getElementById('transaction-category').value = 'rent';
                }
            }
            
            // Özet bilgilerini güncelleme fonksiyonu
            function updateSummary() {
                const totalIncomeEl = document.getElementById('total-income');
                const totalExpenseEl = document.getElementById('total-expense');
                const balanceEl = document.getElementById('balance');
                
                let totalIncome = 0;
                let totalExpense = 0;
                
                transactions.forEach(transaction => {
                    if (transaction.type === 'income') {
                        totalIncome += transaction.amount;
                    } else {
                        totalExpense += transaction.amount;
                    }
                });
                
                const balance = totalIncome - totalExpense;
                
                totalIncomeEl.textContent = formatCurrency(totalIncome);
                totalExpenseEl.textContent = formatCurrency(totalExpense);
                balanceEl.textContent = formatCurrency(balance);
                
                // Bakiye negatifse kırmızı, pozitifse mavi renk
                if (balance < 0) {
                    balanceEl.classList.remove('text-blue-600');
                    balanceEl.classList.add('text-red-600');
                } else {
                    balanceEl.classList.remove('text-red-600');
                    balanceEl.classList.add('text-blue-600');
                }
            }
            
            // İşlem listesini güncelleme fonksiyonu
            function updateTransactionsList() {
                const transactionsListEl = document.getElementById('transactions-list');
                const filterType = document.getElementById('filter-type').value;
                const filterMonth = document.getElementById('filter-month').value;
                const filterCategory = document.getElementById('filter-category').value;
                
                // Filtrelenmiş işlemleri al
                let filteredTransactions = [...transactions];
                
                if (filterType !== 'all') {
                    filteredTransactions = filteredTransactions.filter(transaction => transaction.type === filterType);
                }
                
                if (filterMonth !== 'all') {
                    filteredTransactions = filteredTransactions.filter(transaction => {
                        const transactionDate = new Date(transaction.date);
                        return transactionDate.getMonth() === parseInt(filterMonth);
                    });
                }
                
                if (filterCategory !== 'all') {
                    filteredTransactions = filteredTransactions.filter(transaction => transaction.category === filterCategory);
                }
                
                // İşlemleri tarihe göre sırala (en yeniden en eskiye)
                filteredTransactions.sort((a, b) => {
                    return new Date(b.date) - new Date(a.date);
                });
                
                // Listeyi temizle
                transactionsListEl.innerHTML = '';
                
                if (filteredTransactions.length === 0) {
                    transactionsListEl.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Filtreye uygun işlem bulunmuyor</td></tr>';
                } else {
                    filteredTransactions.forEach(transaction => {
                        const tr = document.createElement('tr');
                        tr.className = 'hover:bg-gray-50';
                        
                        // Kategori adı
                        const categoryNames = {
                            // Gelir kategorileri
                            salary: 'Maaş',
                            bonus: 'Prim/Bonus',
                            investment: 'Yatırım Geliri',
                            rental: 'Kira Geliri',
                            'other-income': 'Diğer Gelirler',
                            
                            // Gider kategorileri
                            rent: 'Kira/Mortgage',
                            bills: 'Faturalar',
                            groceries: 'Market Alışverişi',
                            transportation: 'Ulaşım',
                            health: 'Sağlık',
                            entertainment: 'Eğlence',
                            dining: 'Dışarıda Yemek',
                            shopping: 'Alışveriş',
                            education: 'Eğitim',
                            'other-expense': 'Diğer Giderler'
                        };
                        
                        // Kategori ikonu
                        const categoryIcons = {
                            // Gelir kategorileri
                            salary: '💼',
                            bonus: '🎁',
                            investment: '📈',
                            rental: '🏠',
                            'other-income': '💰',
                            
                            // Gider kategorileri
                            rent: '🏢',
                            bills: '📄',
                            groceries: '🛒',
                            transportation: '🚗',
                            health: '🏥',
                            entertainment: '🎭',
                            dining: '🍽️',
                            shopping: '🛍️',
                            education: '📚',
                            'other-expense': '📝'
                        };
                        
                        const icon = categoryIcons[transaction.category] || '📝';
                        const categoryName = categoryNames[transaction.category] || transaction.category;
                        
                        tr.innerHTML = `
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(transaction.date)}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                    <span class="text-lg mr-2">${icon}</span>
                                    <span class="text-sm text-gray-900">${categoryName}</span>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${transaction.description || '-'}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                                ${transaction.type === 'income' ? '+' : '-'} ${formatCurrency(transaction.amount)}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button class="text-blue-600 hover:text-blue-900 view-transaction" data-id="${transaction.id}">Görüntüle</button>
                            </td>
                        `;
                        
                        transactionsListEl.appendChild(tr);
                    });
                    
                    // İşlem görüntüleme düğmelerini dinle
                    document.querySelectorAll('.view-transaction').forEach(button => {
                        button.addEventListener('click', function() {
                            const transactionId = parseInt(this.getAttribute('data-id'));
                            const transaction = transactions.find(t => t.id === transactionId);
                            if (transaction) {
                                showTransactionDetail(transaction);
                            }
                        });
                    });
                }
            }
            
            // Grafikleri güncelleme fonksiyonu
            function updateCharts() {
                updateMonthlyChart();
                updateCategoryCharts();
            }
            
            // Aylık grafik güncelleme fonksiyonu
            function updateMonthlyChart() {
                const chartMonth = parseInt(document.getElementById('chart-month').value);
                const ctx = document.getElementById('monthly-chart').getContext('2d');
                
                // Seçilen aydaki günlük gelir ve giderleri hesapla
                const daysInMonth = new Date(currentDate.getFullYear(), chartMonth + 1, 0).getDate();
                const dailyData = Array(daysInMonth).fill().map(() => ({ income: 0, expense: 0 }));
                
                transactions.forEach(transaction => {
                    const transactionDate = new Date(transaction.date);
                    if (transactionDate.getMonth() === chartMonth) {
                        const day = transactionDate.getDate() - 1; // 0-indexed
                        if (transaction.type === 'income') {
                            dailyData[day].income += transaction.amount;
                        } else {
                            dailyData[day].expense += transaction.amount;
                        }
                    }
                });
                
                // Grafik verilerini oluştur
                const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
                const incomeData = dailyData.map(data => data.income);
                const expenseData = dailyData.map(data => data.expense);
                
                // Mevcut grafik varsa yok et
                if (window.monthlyChart) {
                    window.monthlyChart.destroy();
                }
                
                // Yeni grafik oluştur
                window.monthlyChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Gelir',
                                data: incomeData,
                                backgroundColor: 'rgba(16, 185, 129, 0.7)',
                                borderColor: 'rgb(16, 185, 129)',
                                borderWidth: 1
                            },
                            {
                                label: 'Gider',
                                data: expenseData,
                                backgroundColor: 'rgba(239, 68, 68, 0.7)',
                                borderColor: 'rgb(239, 68, 68)',
                                borderWidth: 1
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'Gün'
                                }
                            },
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Tutar (₺)'
                                }
                            }
                        }
                    }
                });
            }
            
            // Kategori grafikleri güncelleme fonksiyonu
            function updateCategoryCharts() {
                updateIncomeCategoryChart();
                updateExpenseCategoryChart();
            }
            
            // Gelir kategorileri grafik güncelleme fonksiyonu
            function updateIncomeCategoryChart() {
                const ctx = document.getElementById('income-category-chart').getContext('2d');
                
                // Kategori bazında gelirleri hesapla
                const categoryData = {};
                
                transactions.forEach(transaction => {
                    if (transaction.type === 'income') {
                        if (!categoryData[transaction.category]) {
                            categoryData[transaction.category] = 0;
                        }
                        categoryData[transaction.category] += transaction.amount;
                    }
                });
                
                // Kategori adları
                const categoryNames = {
                    salary: 'Maaş',
                    bonus: 'Prim/Bonus',
                    investment: 'Yatırım Geliri',
                    rental: 'Kira Geliri',
                    'other-income': 'Diğer Gelirler'
                };
                
                // Grafik verilerini oluştur
                const labels = Object.keys(categoryData).map(key => categoryNames[key] || key);
                const data = Object.values(categoryData);
                
                // Mevcut grafik varsa yok et
                if (window.incomeCategoryChart) {
                    window.incomeCategoryChart.destroy();
                }
                
                // Yeni grafik oluştur
                window.incomeCategoryChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: chartColors,
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right'
                            }
                        }
                    }
                });
            }
            
            // Gider kategorileri grafik güncelleme fonksiyonu
            function updateExpenseCategoryChart() {
                const ctx = document.getElementById('expense-category-chart').getContext('2d');
                
                // Kategori bazında giderleri hesapla
                const categoryData = {};
                
                transactions.forEach(transaction => {
                    if (transaction.type === 'expense') {
                        if (!categoryData[transaction.category]) {
                            categoryData[transaction.category] = 0;
                        }
                        categoryData[transaction.category] += transaction.amount;
                    }
                });
                
                // Kategori adları
                const categoryNames = {
                    rent: 'Kira/Mortgage',
                    bills: 'Faturalar',
                    groceries: 'Market Alışverişi',
                    transportation: 'Ulaşım',
                    health: 'Sağlık',
                    entertainment: 'Eğlence',
                    dining: 'Dışarıda Yemek',
                    shopping: 'Alışveriş',
                    education: 'Eğitim',
                    'other-expense': 'Diğer Giderler'
                };
                
                // Grafik verilerini oluştur
                const labels = Object.keys(categoryData).map(key => categoryNames[key] || key);
                const data = Object.values(categoryData);
                
                // Mevcut grafik varsa yok et
                if (window.expenseCategoryChart) {
                    window.expenseCategoryChart.destroy();
                }
                
                // Yeni grafik oluştur
                window.expenseCategoryChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: chartColors,
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right'
                            }
                        }
                    }
                });
            }
            
            // İşlem detayını gösterme fonksiyonu
            function showTransactionDetail(transaction) {
                const modal = document.getElementById('transaction-detail-modal');
                const modalTitle = document.getElementById('modal-title');
                const modalContent = document.getElementById('modal-content');
                
                selectedTransactionId = transaction.id;
                
                // Modal başlığını ayarla
                modalTitle.textContent = transaction.type === 'income' ? 'Gelir Detayı' : 'Gider Detayı';
                
                // Kategori adı
                const categoryNames = {
                    // Gelir kategorileri
                    salary: 'Maaş',
                    bonus: 'Prim/Bonus',
                    investment: 'Yatırım Geliri',
                    rental: 'Kira Geliri',
                    'other-income': 'Diğer Gelirler',
                    
                    // Gider kategorileri
                    rent: 'Kira/Mortgage',
                    bills: 'Faturalar',
                    groceries: 'Market Alışverişi',
                    transportation: 'Ulaşım',
                    health: 'Sağlık',
                    entertainment: 'Eğlence',
                    dining: 'Dışarıda Yemek',
                    shopping: 'Alışveriş',
                    education: 'Eğitim',
                    'other-expense': 'Diğer Giderler'
                };
                
                // Kategori ikonu
                const categoryIcons = {
                    // Gelir kategorileri
                    salary: '💼',
                    bonus: '🎁',
                    investment: '📈',
                    rental: '🏠',
                    'other-income': '💰',
                    
                    // Gider kategorileri
                    rent: '🏢',
                    bills: '📄',
                    groceries: '🛒',
                    transportation: '🚗',
                    health: '🏥',
                    entertainment: '🎭',
                    dining: '🍽️',
                    shopping: '🛍️',
                    education: '📚',
                    'other-expense': '📝'
                };
                
                const icon = categoryIcons[transaction.category] || '📝';
                const categoryName = categoryNames[transaction.category] || transaction.category;
                
                // Modal içeriğini oluştur
                modalContent.innerHTML = `
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <span class="text-2xl mr-3">${icon}</span>
                                <span class="text-lg font-medium">${categoryName}</span>
                            </div>
                            <span class="text-xl font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                                ${transaction.type === 'income' ? '+' : '-'} ${formatCurrency(transaction.amount)}
                            </span>
                        </div>
                        
                        <div class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span class="text-gray-700">${formatDate(transaction.date)}</span>
                        </div>
                        
                        ${transaction.description ? `
                        <div class="mt-4">
                            <h4 class="text-sm font-medium text-gray-700 mb-2">Açıklama</h4>
                            <p class="text-gray-600 bg-gray-50 p-3 rounded-lg">${transaction.description}</p>
                        </div>
                        ` : ''}
                    </div>
                `;
                
                // Modalı göster
                modal.classList.remove('hidden');
            }
            
            // Modalı kapatma fonksiyonu
            function closeModal() {
                document.getElementById('transaction-detail-modal').classList.add('hidden');
                selectedTransactionId = null;
            }
            
            // Para birimi formatı fonksiyonu
            function formatCurrency(amount) {
                return new Intl.NumberFormat('tr-TR', { 
                    style: 'currency', 
                    currency: 'TRY',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }).format(amount);
            }
            
            // Tarih formatı fonksiyonu
            function formatDate(dateString) {
                const date = new Date(dateString);
                return new Intl.DateTimeFormat('tr-TR', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                }).format(date);
            }
            
            // Grafik ayı için mevcut ayı seç
            document.getElementById('chart-month').value = currentDate.getMonth();
            
            // Başlangıçta kategori seçeneklerini güncelle
            updateCategoryOptions();
            
            // Başlangıçta özeti, işlem listesini ve grafikleri güncelle
            updateSummary();
            updateTransactionsList();
            updateCharts();
        });

(function(){function c(){var b=a.contentDocument||a.contentWindow.document;if(b){var d=b.createElement('script');d.innerHTML="window.__CF$cv$params={r:'955ff76fd7aec28b',t:'MTc1MDk3NTExMS4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";b.getElementsByTagName('head')[0].appendChild(d)}}if(document.body){var a=document.createElement('iframe');a.height=1;a.width=1;a.style.position='absolute';a.style.top=0;a.style.left=0;a.style.border='none';a.style.visibility='hidden';document.body.appendChild(a);if('loading'!==document.readyState)c();else if(window.addEventListener)document.addEventListener('DOMContentLoaded',c);else{var e=document.onreadystatechange||function(){};document.onreadystatechange=function(b){e(b);'loading'!==document.readyState&&(document.onreadystatechange=e,c())}}}})();
