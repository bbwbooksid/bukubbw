document.addEventListener("DOMContentLoaded", function() {
    const App = {
        booksPerPage: 25,
        currentPage: 1,
        category: 'ALL',
        searchQuery: '',
        allBooks: [],
        filteredBooks: [],
        isFirstVisit: true,  // Tambahkan ini

        init() {
            window.scrollTo(0, 0);
            this.checkFirstVisit();
            this.loadState();
            this.fetchBooks().then(() => {
                if (this.isFirstVisit) {
                    this.filterByCategory('CHILDREN');
                } else {
                    this.updateBookDisplay();
                }
            });
            this.setupEventListeners();
        },

        checkFirstVisit() {
            this.isFirstVisit = !localStorage.getItem('hasVisited');
            if (this.isFirstVisit) {
                localStorage.setItem('hasVisited', 'true');
                this.category = 'CHILDREN';
            }
        },

        loadState() {
            const savedState = ['currentPage', 'category', 'searchQuery'].reduce((acc, key) => {
                acc[key] = localStorage.getItem(key) || this[key];
                return acc;
            }, {});
            
            Object.assign(this, savedState);
            this.currentPage = parseInt(this.currentPage, 10);
        },

        saveState() {
            ['currentPage', 'category', 'searchQuery'].forEach(key => 
                localStorage.setItem(key, this[key])
            );
        },

        fetchBooks() {
            return fetch('books.json')
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not OK: ' + response.statusText);
                    return response.json();
                })
                .then(data => {
                    this.allBooks = this.processBookData(data);
                })
                .catch(error => console.error('Error:', error));
        },

        processBookData(data) {
            return data.categories.flatMap(category => 
                category.subCategories.flatMap(subCategory => 
                    subCategory.books.map(book => ({
                        ...book,
                        CATEGORY: `${category.categoryName} ${subCategory.subCategoryName}`,
                        subCategoryName: subCategory.subCategoryName
                    }))
                )
            );
        },

        setupEventListeners() {
            const eventMap = {
                'search-button': () => this.handleSearch('search-input'),
                'all-button': () => this.handleAllBooks(),
                'children-button': () => this.filterByCategory("CHILDREN"),
                'fiction-button': () => this.filterByCategory("FICTION"),
                'non-fiction-button': () => this.filterByCategory("NON FICTION"),
                'korean-button': () => this.filterByCategory("KOREAN BOOK"),
                'bca-button': () => this.filterByCategory("JUDUL PILIHAN BCA"),
                'mobile-search-button': () => this.handleSearch('mobile-search-input'),
                'mobile-nav-button': this.toggleMobileNavDropdown,
                'mobile-all-button': () => this.handleCategorySelection("ALL"),
                'mobile-children-button': () => this.handleCategorySelection("CHILDREN"),
                'mobile-fiction-button': () => this.handleCategorySelection("FICTION"),
                'mobile-non-fiction-button': () => this.handleCategorySelection("NON FICTION"),
                'mobile-korean-button': () => this.handleCategorySelection("KOREAN BOOK"),
                'mobile-bca-button': () => this.handleCategorySelection("JUDUL PILIHAN BCA")
            };

            Object.entries(eventMap).forEach(([id, handler]) => 
                document.getElementById(id).addEventListener('click', handler)
            );
        },

        handleSearch(inputId) {
            this.searchQuery = document.getElementById(inputId).value.toLowerCase();
            this.resetAndUpdate();
        },

        handleAllBooks() {
            this.searchQuery = '';
            this.category = 'ALL';
            document.getElementById('search-input').value = '';
            this.resetAndUpdate();
        },

        filterByCategory(category) {
            this.category = category;
            this.searchQuery = '';
            document.getElementById('search-input').value = '';
            this.resetAndUpdate();
        },

        toggleMobileNavDropdown() {
            const dropdown = document.getElementById('mobile-nav-dropdown');
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        },

        handleCategorySelection(category) {
            this.category = category;
            this.searchQuery = '';
            document.getElementById('mobile-search-input').value = '';
            this.resetAndUpdate();
            document.getElementById('mobile-nav-dropdown').style.display = 'none';
        },

        resetAndUpdate() {
            this.currentPage = 1;
            this.saveState();
            this.updateBookDisplay();
        },

        updateBookDisplay() {
            this.filterBooks();
            this.displayBooks(this.filteredBooks, this.currentPage);
            this.setupPagination(this.filteredBooks.length, this.booksPerPage);
        },

        filterBooks() {
            this.filteredBooks = this.allBooks.filter(book => 
                (this.category === 'ALL' || book.CATEGORY.startsWith(this.category)) &&
                (!this.searchQuery || 
                    book.TITLE.toLowerCase().includes(this.searchQuery) ||
                    book.ISBN.toLowerCase().includes(this.searchQuery) ||
                    book.CATEGORY.toLowerCase().includes(this.searchQuery))
            );
        },

        displayBooks: function(books, page) {
            const start = (page - 1) * this.booksPerPage;
            const end = start + this.booksPerPage;
            const paginatedBooks = books.slice(start, end);
            const bookCatalog = document.getElementById('book-catalog');

            bookCatalog.innerHTML = this.createSkeletonLoaders();

            setTimeout(() => {
                bookCatalog.innerHTML = '';
                paginatedBooks.forEach(book => {
                    bookCatalog.appendChild(this.createBookItem(book));
                });
            }, 1000);
        },

        createSkeletonLoaders: function() {
            let skeletonHTML = '';
            for (let i = 0; i < this.booksPerPage; i++) {
                skeletonHTML += `
                    <div class="skeleton-loader">
                        <div class="skeleton-img"></div>
                        <div class="skeleton-text medium"></div>
                        <div class="skeleton-text short"></div>
                        <div class="skeleton-text short"></div>
                        <div class="skeleton-text short"></div>
                    </div>
                `;
            }
            return skeletonHTML;
        },

        createBookItem: function(book) {
            const bookItem = document.createElement('div');
            bookItem.className = 'card';
            bookItem.style.width = '18rem';
        
            if (book.COVER_URL) {
                const bookCover = document.createElement('img');
                bookCover.src = book.COVER_URL;
                bookCover.className = 'card-img-top';
                bookCover.alt = book.TITLE;
                bookItem.appendChild(bookCover);
            }
        
            const cardBody = document.createElement('div');
            cardBody.className = 'card-body';
            bookItem.appendChild(cardBody);
        
            const titleWrapper = document.createElement('div');
            titleWrapper.className = 'card-title-wrapper';
        
            const bookTitle = document.createElement('h5');
            bookTitle.className = 'card-title';
            bookTitle.textContent = book.TITLE;
            titleWrapper.appendChild(bookTitle);
            cardBody.appendChild(titleWrapper);
        
            const bookIsbn = document.createElement('p');
            bookIsbn.className = 'card-text isbn';
            bookIsbn.textContent = `ISBN: ${book.ISBN}`;
            cardBody.appendChild(bookIsbn);
        
            if (book.CATEGORY.startsWith('JUDUL PILIHAN BCA')) {
                if (book['Harga BBW']) {
                    const bbwPriceWrapper = document.createElement('div');
                    bbwPriceWrapper.className = 'book-price new-price-bca';
        
                    const bbwPrice = document.createElement('span');
                    bbwPrice.className = 'old-price';
                    bbwPrice.textContent = `Harga BBW : RP. ${book['Harga BBW']}`;
                    bbwPriceWrapper.appendChild(bbwPrice);
        
                    if (book['Harga PROMO']) {
                        const promoPrice = document.createElement('div');
                        promoPrice.className = 'promo-price';
                        promoPrice.textContent = `Harga Promo BCA : RP. ${book['Harga PROMO']}`;
                        bbwPriceWrapper.appendChild(promoPrice);
                    }
        
                    cardBody.appendChild(bbwPriceWrapper);
                }
            } else if (book['Harga BBW']) {
                const bbwPriceWrapper = document.createElement('div');
                bbwPriceWrapper.className = `book-price ${this.getPriceClass(book.CATEGORY)}`;
        
                const bbwPrice = document.createElement('span');
                bbwPrice.className = 'new-price';
                bbwPrice.textContent = `RP. ${book['Harga BBW']}`;
        
                bbwPriceWrapper.appendChild(bbwPrice);
                cardBody.appendChild(bbwPriceWrapper);
            }
        
            const subCategory = document.createElement('p');
            subCategory.className = 'card-text sub-category';
            subCategory.innerHTML = `<span class="sub-category-name">${book.subCategoryName}</span>`;
            cardBody.appendChild(subCategory);
        
            return bookItem;
        },

        getPriceClass: function(category) {
            const categories = {
                'CHILDREN': 'new-price-children',
                'FICTION': 'new-price-fiction',
                'NON FICTION': 'new-price-non-fiction',
                'KOREAN BOOK': 'new-price-korean',
                'JUDUL PILIHAN BCA': 'new-price-bca'
            };

            for (let key in categories) {
                if (category.startsWith(key)) {
                    return categories[key];
                }
            }
            return '';
        },

        setupPagination: function(totalBooks, booksPerPage) {
            const pagination = document.getElementById('pagination');
            pagination.innerHTML = '';
            const pageCount = Math.ceil(totalBooks / booksPerPage);

            const isMobile = window.innerWidth <= 576;
            const maxVisiblePages = isMobile ? 3 : 7;
            const halfVisiblePages = Math.floor(maxVisiblePages / 2);

            let startPage = this.currentPage - halfVisiblePages;
            let endPage = this.currentPage + halfVisiblePages;

            if (startPage < 1) {
                startPage = 1;
                endPage = Math.min(maxVisiblePages, pageCount);
            } else if (endPage > pageCount) {
                endPage = pageCount;
                startPage = Math.max(1, pageCount - maxVisiblePages + 1);
            }

            const pageInfo = document.getElementById('page-info');
            if (pageInfo) {
                pageInfo.textContent = `Page ${this.currentPage} of ${pageCount} - ${totalBooks} results`;
            }

            for (let i = startPage; i <= endPage; i++) {
                pagination.appendChild(this.createPageItem(i, pageCount));
            }

            if (!isMobile) {
                pagination.insertBefore(this.createNavigationButton('Previous', () => this.changePage(this.currentPage - 1, pageCount)), pagination.firstChild);
                pagination.appendChild(this.createNavigationButton('Next', () => this.changePage(this.currentPage + 1, pageCount)));
            }
        },

        createPageItem: function(pageNumber, pageCount) {
            const pageItem = document.createElement('li');
            pageItem.className = 'page-item' + (pageNumber === this.currentPage ? ' active' : '');
            const pageLink = document.createElement('a');
            pageLink.className = 'page-link';
            pageLink.href = '#';
            pageLink.textContent = pageNumber;
            pageLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.changePage(pageNumber, pageCount);
            });
            pageItem.appendChild(pageLink);
            return pageItem;
        },

        createNavigationButton: function(text, onClick) {
            const item = document.createElement('li');
            item.className = 'page-item';
            const link = document.createElement('a');
            link.className = 'page-link';
            link.href = '#';
            link.textContent = text;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                onClick();
            });
            item.appendChild(link);
            return item;
        },

        changePage: function(newPage, pageCount) {
            if (newPage >= 1 && newPage <= pageCount) {
                this.currentPage = newPage;
                this.saveState();
                this.displayBooks(this.filteredBooks, this.currentPage);
                this.setupPagination(this.filteredBooks.length, this.booksPerPage);
                window.scrollTo(0, 0);
            }
        }
    };

    App.init();
});